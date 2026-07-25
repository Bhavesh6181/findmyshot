package com.findmyshot.controller;

import com.findmyshot.dto.AsyncJobResponse;
import com.findmyshot.dto.JobStatusResponse;
import com.findmyshot.dto.ProcessPhotoRequest;
import com.findmyshot.dto.ProcessPhotoResponse;
import com.findmyshot.service.PhotoService;
import com.findmyshot.service.CloudinaryService;
import com.findmyshot.service.FaceEmbeddingService;
import com.findmyshot.repository.EventRepository;
import com.findmyshot.model.Event;
import com.findmyshot.model.Photo;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.RejectedExecutionException;

@Slf4j
@RestController
public class PhotoController {

    private final PhotoService photoService;
    private final CloudinaryService cloudinaryService;
    private final FaceEmbeddingService faceEmbeddingService;
    private final EventRepository eventRepository;
    private final ExecutorService ioExecutor;
    private final ExecutorService cpuExecutor;

    public PhotoController(PhotoService photoService,
                           CloudinaryService cloudinaryService,
                           FaceEmbeddingService faceEmbeddingService,
                           EventRepository eventRepository,
                           @Qualifier("ioExecutor") ExecutorService ioExecutor,
                           @Qualifier("cpuExecutor") ExecutorService cpuExecutor) {
        this.photoService = photoService;
        this.cloudinaryService = cloudinaryService;
        this.faceEmbeddingService = faceEmbeddingService;
        this.eventRepository = eventRepository;
        this.ioExecutor = ioExecutor;
        this.cpuExecutor = cpuExecutor;
    }

    @PostMapping("/process-photo")
    @ResponseStatus(HttpStatus.OK)
    public ProcessPhotoResponse processPhoto(@Valid @RequestBody ProcessPhotoRequest request) {
        return photoService.processPhotoSync(request);
    }

    @PostMapping("/process-photo/async")
    @ResponseStatus(HttpStatus.OK)
    public AsyncJobResponse processPhotoAsync(@Valid @RequestBody ProcessPhotoRequest request) {
        String jobId = photoService.enqueuePhotoProcessing(request);
        return new AsyncJobResponse(true, jobId);
    }

    /**
     * Optimised upload endpoint:
     * 1. Read MultipartFile bytes ONCE.
     * 2. Fire Cloudinary upload (I/O) and face inference (CPU) in PARALLEL.
     * 3. Return immediately with the CDN URL; MongoDB persistence happens
     *    asynchronously once both futures resolve.
     * 4. Return 429 + Retry-After when the CPU queue is full so the frontend
     *    backs off instead of flooding a saturated server.
     */
    @PostMapping("/api/upload")
    public ResponseEntity<?> uploadPhoto(
            @RequestParam("file") MultipartFile file,
            @RequestParam("eventCode") String eventCode) throws IOException {

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Only image files are accepted. Got: " + contentType);
        }

        // Read bytes ONCE — reused for both CDN upload and inference
        final byte[] imageBytes = file.getBytes();
        final String originalFilename = file.getOriginalFilename();
        final String jobId = UUID.randomUUID().toString();

        // ── I/O-bound: Cloudinary upload ─────────────────────────────────────
        CompletableFuture<CloudinaryService.UploadResult> uploadFuture =
                CompletableFuture.supplyAsync(() -> {
                    try {
                        return cloudinaryService.uploadImageBytes(imageBytes, "events/" + eventCode.toUpperCase());
                    } catch (IOException e) {
                        throw new RuntimeException("Cloudinary upload failed: " + e.getMessage(), e);
                    }
                }, ioExecutor);

        // ── CPU-bound: face inference (may be queued or rejected) ────────────
        CompletableFuture<List<float[]>> inferenceFuture;
        try {
            inferenceFuture = CompletableFuture.supplyAsync(
                    () -> faceEmbeddingService.getAllFaceEmbeddingsFromBytes(imageBytes),
                    cpuExecutor);
        } catch (RejectedExecutionException e) {
            // CPU queue is full — tell the client to retry in 5 seconds
            log.warn("CPU inference queue full. Rejecting upload for job {}", jobId);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .header("Retry-After", "5")
                    .body("{\"success\":false,\"error\":\"queue_full\",\"message\":\"Server is busy processing images. Please retry in a few seconds.\"}");
        }

        // ── Persist to MongoDB once both finish (non-blocking) ───────────────
        uploadFuture.thenCombineAsync(inferenceFuture, (uploadResult, embeddings) -> {
            try {
                Event event = eventRepository.findByCode(eventCode.toUpperCase())
                        .orElse(null);
                if (event == null) {
                    log.error("Event not found for code: {}", eventCode);
                    return null;
                }

                Photo photo = new Photo();
                photo.setUrl(uploadResult.getUrl());
                photo.setCloudinaryId(uploadResult.getCloudinaryId());
                photo.setFaceEmbeddings(embeddings);
                photo.setUploadedAt(Instant.now());
                photo.setFilename(originalFilename);

                if (event.getPhotos() == null) {
                    event.setPhotos(new ArrayList<>());
                }
                event.getPhotos().removeIf(p -> uploadResult.getCloudinaryId().equals(p.getCloudinaryId()));
                event.getPhotos().add(photo);
                event.setUpdatedAt(Instant.now());
                eventRepository.save(event);

                log.info("Persisted photo {} with {} embeddings for event {}", 
                        uploadResult.getCloudinaryId(), embeddings.size(), eventCode);
            } catch (Exception ex) {
                log.error("Failed to persist photo for event {}: {}", eventCode, ex.getMessage(), ex);
            }
            return null;
        }, ioExecutor);

        // Return immediately — don't wait for inference or DB write
        ProcessPhotoResponse response = ProcessPhotoResponse.builder()
                .success(true)
                .url(null)          // URL not yet known (CDN upload still running)
                .cloudinaryId(null)
                .facesFound(-1)
                .facesDetected(-1)
                .processing(true)
                .jobId(jobId)
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/jobs/{jobId}")
    public JobStatusResponse getJobStatus(@PathVariable String jobId) {
        return photoService.getJobStatus(jobId);
    }

    @DeleteMapping("/photos/{cloudinaryId}")
    @ResponseStatus(HttpStatus.OK)
    public java.util.Map<String, Object> deletePhoto(@PathVariable String cloudinaryId) {
        photoService.deletePhoto(cloudinaryId);
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("success", true);
        return response;
    }
}
