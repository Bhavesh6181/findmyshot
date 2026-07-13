package com.findmyshot.service;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.net.URL;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class FaceEmbeddingServiceTest {

    @Test
    void testExtractEmbedding() throws Exception {
        FaceEmbeddingService service = new FaceEmbeddingService();
        
        // Configure local paths relative to findmyshot-backend/
        ReflectionTestUtils.setField(service, "faceDetectionPath", "models/det_500m.onnx");
        ReflectionTestUtils.setField(service, "faceRecognitionPath", "models/w600k_mbf.onnx");
        
        // Initialize sessions
        service.init();
        
        try {
            // Load test image (Lena) from resources
            URL resource = getClass().getClassLoader().getResource("face.jpg");
            assertNotNull(resource, "face.jpg must be present in test resources");
            Path imagePath = Paths.get(resource.toURI());
            
            // Extract single primary embedding
            float[] embedding = service.getEmbedding(imagePath);
            
            // Assert embedding format and validity
            assertNotNull(embedding, "Embedding should not be null");
            assertEquals(512, embedding.length, "Embedding dimension must be 512");
            
            // Check L2 normalization (sum of squares is ~1.0)
            float sumSq = 0.0f;
            for (float val : embedding) {
                sumSq += val * val;
            }
            assertTrue(sumSq > 0.0f, "Embedding vector must be non-zero");
            assertEquals(1.0f, sumSq, 0.01f, "Embedding should be L2 normalized");
            
            // Extract all face embeddings
            List<float[]> allEmbeddings = service.getAllFaceEmbeddings(imagePath);
            assertNotNull(allEmbeddings, "All embeddings list should not be null");
            assertFalse(allEmbeddings.isEmpty(), "Should detect at least one face in Lena image");
            assertEquals(512, allEmbeddings.get(0).length, "Embedding dimension must be 512");
            
        } finally {
            // Ensure sessions close
            service.cleanup();
        }
    }
}

