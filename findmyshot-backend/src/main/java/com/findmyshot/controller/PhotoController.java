package com.findmyshot.controller;

import com.findmyshot.dto.AsyncJobResponse;
import com.findmyshot.dto.JobStatusResponse;
import com.findmyshot.dto.ProcessPhotoRequest;
import com.findmyshot.dto.ProcessPhotoResponse;
import com.findmyshot.service.PhotoService;
import com.findmyshot.service.CloudinaryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
public class PhotoController {

    private final PhotoService photoService;
    private final CloudinaryService cloudinaryService;

    public PhotoController(PhotoService photoService, CloudinaryService cloudinaryService) {
        this.photoService = photoService;
        this.cloudinaryService = cloudinaryService;
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

    @PostMapping("/api/upload")
    @ResponseStatus(HttpStatus.OK)
    public ProcessPhotoResponse uploadPhoto(
            @RequestParam("file") MultipartFile file,
            @RequestParam("eventCode") String eventCode) throws IOException {

        // 1. Validate: only image files allowed
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only image files (JPEG, PNG, WEBP, HEIC, etc.) are accepted. Got: " + contentType
            );
        }

        // 2. Upload the image directly to Cloudinary
        CloudinaryService.UploadResult uploadResult = cloudinaryService.uploadImage(file, "events/" + eventCode);

        // 3. Prepare the ProcessPhotoRequest
        ProcessPhotoRequest request = new ProcessPhotoRequest();
        request.setUrl(uploadResult.getUrl());
        request.setCloudinaryUrl(uploadResult.getUrl());
        request.setCloudinaryId(uploadResult.getCloudinaryId());
        request.setEventCode(eventCode);
        request.setFilename(file.getOriginalFilename());

        // 4. Process the photo through the PhotoService (embeddings + MongoDB entry)
        return photoService.processPhotoSync(request);
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

