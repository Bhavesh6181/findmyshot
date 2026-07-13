package com.findmyshot.service;

import com.findmyshot.dto.MatchRequest;
import com.findmyshot.dto.MatchResponse;
import com.findmyshot.dto.MatchResult;
import com.findmyshot.model.Event;
import com.findmyshot.repository.EventRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

@Slf4j
@Service
public class MatchService {

    private final EventRepository eventRepository;
    private final FaceEmbeddingService faceEmbeddingService;
    private final SimilarityService similarityService;

    public MatchService(EventRepository eventRepository,
                        FaceEmbeddingService faceEmbeddingService,
                        SimilarityService similarityService) {
        this.eventRepository = eventRepository;
        this.faceEmbeddingService = faceEmbeddingService;
        this.similarityService = similarityService;
    }

    /**
     * Decodes the selfie base64 image, extracts its 512-dim embedding, 
     * finds candidate matches in the Event's photos, and returns matches >= 0.4 similarity.
     */
    public MatchResponse matchSelfie(MatchRequest request) {
        String eventCode = request.getEventCodeToUse();
        if (eventCode == null || eventCode.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Event code or ID is required");
        }

        String base64Data = request.getSelfieBase64();
        if (base64Data == null || base64Data.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selfie base64 content is required");
        }

        // Clean data URI scheme prefix if present
        if (base64Data.contains(",")) {
            base64Data = base64Data.substring(base64Data.indexOf(",") + 1);
        }

        log.info("Matching selfie for event code: {}", eventCode);

        // Fetch Event from MongoDB
        Event event = eventRepository.findByCode(eventCode.toUpperCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));

        Path tempSelfie = null;
        try {
            // Decode base64 to byte array
            byte[] imageBytes = Base64.getDecoder().decode(base64Data.trim());

            // Write to a temporary file
            tempSelfie = Files.createTempFile("selfie_", ".jpg");
            Files.write(tempSelfie, imageBytes);

            // Extract the primary face embedding (returns L2-normalized 512-dim vector)
            float[] selfieEmbedding = faceEmbeddingService.getEmbedding(tempSelfie);
            if (selfieEmbedding == null || selfieEmbedding.length == 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No faces detected in the provided selfie");
            }

            int totalScanned = event.getPhotos() != null ? event.getPhotos().size() : 0;
            List<MatchResult> matches = new ArrayList<>();

            if (event.getPhotos() != null && !event.getPhotos().isEmpty()) {
                matches = similarityService.findMatches(selfieEmbedding, event.getPhotos(), 0.4);
            }

            log.info("Found {} matching photos out of {} total scanned in event {}", matches.size(), totalScanned, eventCode);

            return MatchResponse.builder()
                    .matches(matches)
                    .photos(matches) // compatibility alias
                    .totalScanned(totalScanned)
                    .build();

        } catch (IllegalArgumentException e) {
            log.error("Failed to decode base64 selfie string", e);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid base64 string format");
        } catch (IOException e) {
            log.error("Failed to process file operations for matching", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Selfie file processing error");
        } finally {
            if (tempSelfie != null) {
                try {
                    Files.deleteIfExists(tempSelfie);
                } catch (IOException ex) {
                    log.error("Failed to delete temp selfie file: " + tempSelfie, ex);
                }
            }
        }
    }
}

