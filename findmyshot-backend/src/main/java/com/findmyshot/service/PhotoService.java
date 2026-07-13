package com.findmyshot.service;

import com.findmyshot.dto.JobStatusResponse;
import com.findmyshot.dto.ProcessPhotoRequest;
import com.findmyshot.dto.ProcessPhotoResponse;
import com.findmyshot.model.Event;
import com.findmyshot.model.Photo;
import com.findmyshot.repository.EventRepository;
import jakarta.annotation.PreDestroy;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Slf4j
@Service
public class PhotoService {

    private final EventRepository eventRepository;
    private final FaceEmbeddingService faceEmbeddingService;
    private final CloudinaryService cloudinaryService;
    private final MongoTemplate mongoTemplate;

    private final Map<String, JobInfo> jobs = new ConcurrentHashMap<>();
    private final ExecutorService executorService = Executors.newFixedThreadPool(
            Math.max(2, Runtime.getRuntime().availableProcessors())
    );

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    private static class JobInfo {
        private String id;
        private String status; // "queued", "running", "completed", "failed"
        private String createdAt;
        private Object result;
        private String error;
    }

    public PhotoService(EventRepository eventRepository,
                        FaceEmbeddingService faceEmbeddingService,
                        CloudinaryService cloudinaryService,
                        MongoTemplate mongoTemplate) {
        this.eventRepository = eventRepository;
        this.faceEmbeddingService = faceEmbeddingService;
        this.cloudinaryService = cloudinaryService;
        this.mongoTemplate = mongoTemplate;
    }

    @PreDestroy
    public void shutdown() {
        log.info("Shutting down PhotoService executor thread pool...");
        executorService.shutdown();
    }

    /**
     * Synchronously processes a photo: downloads it, extracts face embeddings,
     * updates the event document metadata in MongoDB, and returns the result.
     */
    public ProcessPhotoResponse processPhotoSync(ProcessPhotoRequest request) {
        String url = request.getUrlToUse();
        if (url == null || url.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Secure photo URL is required");
        }

        String eventCode = request.getEventCode();
        String cloudinaryId = request.getCloudinaryId();
        String filename = request.getFilename() != null ? request.getFilename() : "";

        log.info("Processing photo synchronously: eventCode={}, cloudinaryId={}, url={}", eventCode, cloudinaryId, url);

        // Fetch Event from MongoDB
        Event event = eventRepository.findByCode(eventCode.toUpperCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));

        Path tempFile = null;
        try {
            // Create a temporary file to hold the downloaded image
            tempFile = Files.createTempFile("photo_", ".jpg");
            try (InputStream in = new URL(url).openStream()) {
                Files.copy(in, tempFile, StandardCopyOption.REPLACE_EXISTING);
            }

            // Extract face embeddings
            List<float[]> embeddings = faceEmbeddingService.getAllFaceEmbeddings(tempFile);
            log.info("Extracted {} face embeddings from temp photo file.", embeddings.size());

            // Map to Photo document
            Photo photo = new Photo();
            photo.setUrl(url);
            photo.setCloudinaryId(cloudinaryId);
            photo.setFaceEmbeddings(embeddings);
            photo.setUploadedAt(Instant.now());
            photo.setFilename(filename);

            // Ensure no duplicate cloudinaryIds in the photos list of this Event
            if (event.getPhotos() == null) {
                event.setPhotos(new ArrayList<>());
            }
            event.getPhotos().removeIf(p -> cloudinaryId.equals(p.getCloudinaryId()));
            event.getPhotos().add(photo);
            event.setUpdatedAt(Instant.now());

            eventRepository.save(event);

            return ProcessPhotoResponse.builder()
                    .success(true)
                    .facesFound(embeddings.size())
                    .facesDetected(embeddings.size())
                    .url(url)
                    .cloudinaryId(cloudinaryId)
                    .build();

        } catch (IOException e) {
            log.error("Failed to download or parse photo: url=" + url, e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to download/parse photo: " + e.getMessage());
        } finally {
            if (tempFile != null) {
                try {
                    Files.deleteIfExists(tempFile);
                } catch (IOException ex) {
                    log.error("Failed to delete temp file: " + tempFile, ex);
                }
            }
        }
    }

    /**
     * Enqueues photo processing asynchronously. Returns the unique Job ID.
     */
    public String enqueuePhotoProcessing(ProcessPhotoRequest request) {
        String jobId = UUID.randomUUID().toString();
        log.info("Enqueuing photo processing async task. Job ID: {}", jobId);

        JobInfo job = JobInfo.builder()
                .id(jobId)
                .status("queued")
                .createdAt(Instant.now().toString())
                .build();
        jobs.put(jobId, job);

        // Submit task to the thread pool executor
        executorService.submit(() -> {
            jobs.put(jobId, JobInfo.builder()
                    .id(jobId)
                    .status("running")
                    .createdAt(job.getCreatedAt())
                    .build());
            try {
                ProcessPhotoResponse result = processPhotoSync(request);
                jobs.put(jobId, JobInfo.builder()
                        .id(jobId)
                        .status("completed")
                        .createdAt(job.getCreatedAt())
                        .result(result)
                        .build());
            } catch (Exception e) {
                log.error("Async job processing failed: jobId=" + jobId, e);
                jobs.put(jobId, JobInfo.builder()
                        .id(jobId)
                        .status("failed")
                        .createdAt(job.getCreatedAt())
                        .error(e.getMessage())
                        .build());
            }
        });

        return jobId;
    }

    /**
     * Retrieves the status of an asynchronous job by Job ID.
     */
    public JobStatusResponse getJobStatus(String jobId) {
        JobInfo job = jobs.get(jobId);
        if (job == null) {
            return JobStatusResponse.builder().found(false).build();
        }

        return JobStatusResponse.builder()
                .found(true)
                .id(job.getId())
                .status(job.getStatus())
                .createdAt(job.getCreatedAt())
                .result(job.getResult())
                .error(job.getError())
                .build();
    }

    /**
     * Deletes a photo: destroys it in Cloudinary and removes it from all matching Event documents.
     */
    public void deletePhoto(String cloudinaryId) {
        log.info("Deleting photo: cloudinaryId={}", cloudinaryId);

        // 1. Delete image from Cloudinary
        try {
            cloudinaryService.deleteImage(cloudinaryId);
        } catch (IOException e) {
            log.error("Failed to delete image from Cloudinary for ID: " + cloudinaryId, e);
        }

        // 2. Remove photo entry from the photos list inside matching events
        Query query = Query.query(Criteria.where("photos.cloudinary_id").is(cloudinaryId));
        Update update = new Update()
                .set("updatedAt", Instant.now())
                .pull("photos", Query.query(Criteria.where("cloudinary_id").is(cloudinaryId)));

        mongoTemplate.updateFirst(query, update, Event.class);
        log.info("Removed photo entry with cloudinaryId={} from Event documents", cloudinaryId);
    }
}

