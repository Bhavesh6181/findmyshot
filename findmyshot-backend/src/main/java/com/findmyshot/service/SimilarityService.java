package com.findmyshot.service;

import com.findmyshot.dto.MatchResult;
import com.findmyshot.model.Photo;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class SimilarityService {

    /**
     * Calculates the cosine similarity between two float vectors.
     * cos(theta) = (A . B) / (||A|| * ||B||)
     */
    public double cosineSimilarity(float[] a, float[] b) {
        if (a == null || b == null || a.length != b.length) {
            return 0.0;
        }
        
        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;
        
        for (int i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        
        if (normA == 0.0 || normB == 0.0) {
            return 0.0;
        }
        
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    /**
     * Compares the target face embedding with all face embeddings of each candidate photo.
     * Filters photos that have at least one face matching with a similarity score >= threshold.
     * Returns a list of MatchResults sorted in descending order of similarity score.
     */
    public List<MatchResult> findMatches(float[] targetEmbedding, List<Photo> candidatePhotos, double threshold) {
        if (targetEmbedding == null || candidatePhotos == null) {
            return Collections.emptyList();
        }

        List<MatchResult> matches = new ArrayList<>();

        for (Photo photo : candidatePhotos) {
            double maxScore = -1.0;
            boolean hasMatch = false;

            if (photo.getFaceEmbeddings() != null) {
                for (float[] faceEmb : photo.getFaceEmbeddings()) {
                    double score = cosineSimilarity(targetEmbedding, faceEmb);
                    if (score >= threshold) {
                        hasMatch = true;
                        if (score > maxScore) {
                            maxScore = score;
                        }
                    }
                }
            }

            if (hasMatch) {
                // Round similarity score to 2 decimal places to match python: round(score, 2)
                double roundedScore = Math.round(maxScore * 100.0) / 100.0;
                matches.add(new MatchResult(photo.getUrl(), photo.getCloudinaryId(), roundedScore));
            }
        }

        // Sort descending by score
        matches.sort((m1, m2) -> Double.compare(m2.getSimilarityScore(), m1.getSimilarityScore()));

        return matches;
    }
}

