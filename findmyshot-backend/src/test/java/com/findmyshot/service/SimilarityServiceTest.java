package com.findmyshot.service;

import com.findmyshot.dto.MatchResult;
import com.findmyshot.model.Photo;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class SimilarityServiceTest {

    private final SimilarityService similarityService = new SimilarityService();

    @Test
    void testCosineSimilarityIdenticalVectors() {
        float[] a = {1.0f, 2.0f, 3.0f};
        float[] b = {1.0f, 2.0f, 3.0f};
        
        double score = similarityService.cosineSimilarity(a, b);
        assertEquals(1.0, score, 0.0001, "Identical vectors must have similarity of 1.0");
    }

    @Test
    void testCosineSimilarityOrthogonalVectors() {
        float[] a = {1.0f, 0.0f, 0.0f};
        float[] b = {0.0f, 1.0f, 0.0f};
        
        double score = similarityService.cosineSimilarity(a, b);
        assertEquals(0.0, score, 0.0001, "Orthogonal vectors must have similarity of 0.0");
    }

    @Test
    void testCosineSimilarityInverseVectors() {
        float[] a = {1.0f, 2.0f};
        float[] b = {-1.0f, -2.0f};
        
        double score = similarityService.cosineSimilarity(a, b);
        assertEquals(-1.0, score, 0.0001, "Opposite vectors must have similarity of -1.0");
    }

    @Test
    void testFindMatchesFilteringAndSorting() {
        float[] target = {1.0f, 0.0f}; // Target vector

        // Create mock photos
        // Photo 1: Matches above threshold (score = 1.0)
        Photo p1 = new Photo("id1", "url1", Collections.singletonList(new float[]{1.0f, 0.0f}), Instant.now(), "f1.jpg");
        
        // Photo 2: Matches above threshold with multiple faces (max score = 0.8)
        Photo p2 = new Photo("id2", "url2", Arrays.asList(
                new float[]{0.8f, 0.6f}, // cos = 0.8
                new float[]{0.0f, 1.0f}  // cos = 0.0
        ), Instant.now(), "f2.jpg");
        
        // Photo 3: Does not match above threshold (score = 0.0)
        Photo p3 = new Photo("id3", "url3", Collections.singletonList(new float[]{0.0f, 1.0f}), Instant.now(), "f3.jpg");

        List<Photo> candidates = Arrays.asList(p1, p2, p3);

        // Find matches with threshold 0.4
        List<MatchResult> matches = similarityService.findMatches(target, candidates, 0.4);

        // Assertions
        assertEquals(2, matches.size(), "Should have exactly 2 matched photos");
        
        // Assert sort order (descending by similarityScore)
        assertEquals("id1", matches.get(0).getCloudinaryId(), "Highest score should be first");
        assertEquals(1.0, matches.get(0).getSimilarityScore(), 0.001);

        assertEquals("id2", matches.get(1).getCloudinaryId(), "Second highest score should be second");
        assertEquals(0.8, matches.get(1).getSimilarityScore(), 0.001);
    }
}

