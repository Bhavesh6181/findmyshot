package com.findmyshot.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import jakarta.annotation.PostConstruct;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Slf4j
@Service
public class CloudinaryService {

    @Value("${cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${cloudinary.api-key:}")
    private String apiKey;

    @Value("${cloudinary.api-secret:}")
    private String apiSecret;

    private Cloudinary cloudinary;

    @Data
    @AllArgsConstructor
    public static class UploadResult {
        private String url;
        private String cloudinaryId;
    }

    @PostConstruct
    public void init() {
        if (cloudName != null && !cloudName.trim().isEmpty() &&
            apiKey != null && !apiKey.trim().isEmpty() &&
            apiSecret != null && !apiSecret.trim().isEmpty()) {
            
            log.info("Initializing Cloudinary client with cloud_name: {}", cloudName);
            this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                    "cloud_name", cloudName,
                    "api_key", apiKey,
                    "api_secret", apiSecret,
                    "secure", true
            ));
        } else {
            log.warn("Cloudinary configuration credentials are missing or incomplete. Cloudinary operations will be disabled.");
        }
    }

    /**
     * Uploads a MultipartFile to Cloudinary in the specified folder.
     * Returns an UploadResult containing the secure URL and public ID.
     */
    public UploadResult uploadImage(MultipartFile file, String folder) throws IOException {
        if (cloudinary == null) {
            throw new IllegalStateException("Cloudinary is not configured. Check credentials in configuration.");
        }

        log.debug("Uploading file {} to Cloudinary folder {}", file.getOriginalFilename(), folder);
        Map<?, ?> result = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap("folder", folder)
        );

        String url = (String) result.get("secure_url");
        String cloudinaryId = (String) result.get("public_id");

        log.info("Successfully uploaded image. URL: {}, Cloudinary ID: {}", url, cloudinaryId);
        return new UploadResult(url, cloudinaryId);
    }

    /**
     * Destroys/deletes an image from Cloudinary using its public ID.
     */
    public void deleteImage(String cloudinaryId) throws IOException {
        if (cloudinary == null) {
            log.warn("Cloudinary is not configured. Skipping deletion of public ID: {}", cloudinaryId);
            return;
        }

        log.debug("Deleting image from Cloudinary: {}", cloudinaryId);
        Map<?, ?> result = cloudinary.uploader().destroy(cloudinaryId, ObjectUtils.emptyMap());
        log.info("Cloudinary delete result for ID {}: {}", cloudinaryId, result);
    }
}

