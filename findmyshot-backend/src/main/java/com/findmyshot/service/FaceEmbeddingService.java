package com.findmyshot.service;

import ai.onnxruntime.OnnxTensor;
import ai.onnxruntime.OrtEnvironment;
import ai.onnxruntime.OrtException;
import ai.onnxruntime.OrtSession;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.FloatBuffer;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Slf4j
@Service
public class FaceEmbeddingService {

    private static final int DET_INPUT_SIZE = 640;
    private static final int REC_INPUT_SIZE = 112;

    @Value("${models.face-detection-path}")
    private String faceDetectionPath;

    @Value("${models.face-recognition-path}")
    private String faceRecognitionPath;

    private OrtEnvironment env;
    private OrtSession detSession;
    private OrtSession recSession;

    public static class DetectedFace {
        public float x1, y1, x2, y2;
        public float score;
        public float[] landmarks;

        public DetectedFace(float x1, float y1, float x2, float y2, float score, float[] landmarks) {
            this.x1 = x1;
            this.y1 = y1;
            this.x2 = x2;
            this.y2 = y2;
            this.score = score;
            this.landmarks = landmarks;
        }

        public float getArea() {
            return (x2 - x1) * (y2 - y1);
        }
    }

    @PostConstruct
    public void init() {
        log.info("Initializing ONNX models. Detection: {}, Recognition: {}", faceDetectionPath, faceRecognitionPath);
        try {
            this.env = OrtEnvironment.getEnvironment();

            // Force single-threaded math — on a 0.1-0.5 vCPU container,
            // intra-op parallelism only adds context-switch overhead.
            OrtSession.SessionOptions detOpts = new OrtSession.SessionOptions();
            detOpts.setIntraOpNumThreads(1);
            detOpts.setInterOpNumThreads(1);
            detOpts.setExecutionMode(OrtSession.SessionOptions.ExecutionMode.SEQUENTIAL);
            detOpts.setOptimizationLevel(OrtSession.SessionOptions.OptLevel.ALL_OPT);
            this.detSession = env.createSession(faceDetectionPath, detOpts);
            log.info("Face detection model loaded. Inputs: {}, Outputs: {}",
                    detSession.getInputNames(), detSession.getOutputNames());

            OrtSession.SessionOptions recOpts = new OrtSession.SessionOptions();
            recOpts.setIntraOpNumThreads(1);
            recOpts.setInterOpNumThreads(1);
            recOpts.setExecutionMode(OrtSession.SessionOptions.ExecutionMode.SEQUENTIAL);
            recOpts.setOptimizationLevel(OrtSession.SessionOptions.OptLevel.ALL_OPT);
            this.recSession = env.createSession(faceRecognitionPath, recOpts);
            log.info("Face recognition model loaded. Inputs: {}, Outputs: {}",
                    recSession.getInputNames(), recSession.getOutputNames());

            warmUp();

        } catch (Exception e) {
            log.error("Failed to initialize ONNX sessions", e);
            throw new RuntimeException("ONNX initialization failed", e);
        }
    }

    /**
     * Warm-up: run both sessions once with zeroed tensors so the first real
     * request doesn't pay model-initialization latency.
     */
    private void warmUp() {
        log.info("Warming up ONNX models...");
        try {
            float[] dummyDet = new float[1 * 3 * DET_INPUT_SIZE * DET_INPUT_SIZE];
            long[] detShape = {1, 3, DET_INPUT_SIZE, DET_INPUT_SIZE};
            try (OnnxTensor t = OnnxTensor.createTensor(env, FloatBuffer.wrap(dummyDet), detShape)) {
                String name = detSession.getInputNames().iterator().next();
                detSession.run(Collections.singletonMap(name, t)).close();
            }

            float[] dummyRec = new float[1 * 3 * REC_INPUT_SIZE * REC_INPUT_SIZE];
            long[] recShape = {1, 3, REC_INPUT_SIZE, REC_INPUT_SIZE};
            try (OnnxTensor t = OnnxTensor.createTensor(env, FloatBuffer.wrap(dummyRec), recShape)) {
                String name = recSession.getInputNames().iterator().next();
                recSession.run(Collections.singletonMap(name, t)).close();
            }
            log.info("ONNX warm-up complete.");
        } catch (Exception e) {
            log.warn("ONNX warm-up failed (non-fatal): {}", e.getMessage());
        }
    }

    @PreDestroy
    public void cleanup() {
        log.info("Closing ONNX sessions...");
        try {
            if (detSession != null) {
                detSession.close();
            }
            if (recSession != null) {
                recSession.close();
            }
            if (env != null) {
                env.close();
            }
        } catch (Exception e) {
            log.error("Error during ONNX cleanup", e);
        }
    }

    /**
     * Extracts embedding for the primary (largest) face in the image.
     */
    public float[] getEmbedding(Path imagePath) {
        log.debug("Extracting primary embedding for image: {}", imagePath);
        try {
            BufferedImage image = ImageIO.read(imagePath.toFile());
            if (image == null) {
                throw new IOException("Failed to load image: " + imagePath);
            }

            List<DetectedFace> faces = detectFaces(image, 0.5f);
            if (faces.isEmpty()) {
                // Fall back to 0.3 threshold if no faces found
                faces = detectFaces(image, 0.3f);
            }

            if (faces.isEmpty()) {
                log.warn("No faces detected in image: {}", imagePath);
                return null;
            }

            // Find the primary (largest) face
            DetectedFace primaryFace = Collections.max(faces, (a, b) -> Float.compare(a.getArea(), b.getArea()));
            log.info("Primary face detected. Bbox: [{}, {}, {}, {}], area: {}, score: {}", 
                    primaryFace.x1, primaryFace.y1, primaryFace.x2, primaryFace.y2, primaryFace.getArea(), primaryFace.score);

            return extractEmbedding(image, primaryFace);

        } catch (Exception e) {
            log.error("Error getting primary embedding for image " + imagePath, e);
            return null;
        }
    }

    /**
     * Extracts embeddings for all detected faces in the image.
     */
    public List<float[]> getAllFaceEmbeddings(Path imagePath) {
        log.debug("Extracting all face embeddings for image: {}", imagePath);
        try {
            BufferedImage image = ImageIO.read(imagePath.toFile());
            if (image == null) {
                throw new IOException("Failed to load image: " + imagePath);
            }
            return extractFromImage(image, imagePath.toString());
        } catch (Exception e) {
            log.error("Error getting all face embeddings for image " + imagePath, e);
            return Collections.emptyList();
        }
    }

    /**
     * Extracts face embeddings directly from a byte array — avoids the
     * Cloudinary re-download loop. Called by the upload controller so the
     * image is read exactly once from the incoming MultipartFile.
     */
    public List<float[]> getAllFaceEmbeddingsFromBytes(byte[] imageBytes) {
        log.debug("Extracting face embeddings from in-memory byte array ({} bytes)", imageBytes.length);
        try {
            BufferedImage image = ImageIO.read(new java.io.ByteArrayInputStream(imageBytes));
            if (image == null) {
                log.warn("Failed to decode image from byte array");
                return Collections.emptyList();
            }
            return extractFromImage(image, "in-memory");
        } catch (Exception e) {
            log.error("Error getting face embeddings from byte array", e);
            return Collections.emptyList();
        }
    }

    /** Shared extraction logic used by both path-based and byte[]-based entry points. */
    private List<float[]> extractFromImage(BufferedImage image, String label) throws OrtException {
        List<DetectedFace> faces = detectFaces(image, 0.5f);
        if (faces.isEmpty()) {
            faces = detectFaces(image, 0.3f);
        }
        if (faces.isEmpty()) {
            log.info("No faces detected in image: {}", label);
            return Collections.emptyList();
        }
        List<float[]> embeddings = new ArrayList<>();
        for (DetectedFace face : faces) {
            float[] embedding = extractEmbedding(image, face);
            if (embedding != null) {
                embeddings.add(embedding);
            }
        }
        log.info("Extracted {} embeddings from {}", embeddings.size(), label);
        return embeddings;
    }

    /**
     * Run face detection on the input image.
     */
    private List<DetectedFace> detectFaces(BufferedImage sourceImage, float threshold) throws OrtException {
        int sourceWidth = sourceImage.getWidth();
        int sourceHeight = sourceImage.getHeight();

        // Rescale keeping aspect ratio
        float scale = Math.min((float) DET_INPUT_SIZE / sourceWidth, (float) DET_INPUT_SIZE / sourceHeight);
        int newWidth = Math.round(sourceWidth * scale);
        int newHeight = Math.round(sourceHeight * scale);

        // Create the canvas of size DET_INPUT_SIZE x DET_INPUT_SIZE with black background
        BufferedImage paddedImage = new BufferedImage(DET_INPUT_SIZE, DET_INPUT_SIZE, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = paddedImage.createGraphics();
        g.setColor(Color.BLACK);
        g.fillRect(0, 0, DET_INPUT_SIZE, DET_INPUT_SIZE);
        g.drawImage(sourceImage, 0, 0, newWidth, newHeight, null);
        g.dispose();

        // Convert BufferedImage to input float array
        float[] inputData = new float[3 * DET_INPUT_SIZE * DET_INPUT_SIZE];
        int[] pixels = paddedImage.getRGB(0, 0, DET_INPUT_SIZE, DET_INPUT_SIZE, null, 0, DET_INPUT_SIZE);

        float mean = 127.5f;
        float std = 128.0f;

        // Normalization: (x - 127.5) / 128.0, channel first (RGB)
        for (int i = 0; i < pixels.length; i++) {
            int pixel = pixels[i];
            int r = (pixel >> 16) & 0xFF;
            int gVal = (pixel >> 8) & 0xFF;
            int b = pixel & 0xFF;

            inputData[i] = (r - mean) / std;
            inputData[pixels.length + i] = (gVal - mean) / std;
            inputData[2 * pixels.length + i] = (b - mean) / std;
        }

        long[] shape = {1, 3, DET_INPUT_SIZE, DET_INPUT_SIZE};
        try (OnnxTensor inputTensor = OnnxTensor.createTensor(env, FloatBuffer.wrap(inputData), shape)) {
            String inputName = detSession.getInputNames().iterator().next();
            try (OrtSession.Result results = detSession.run(Collections.singletonMap(inputName, inputTensor))) {
                
                List<DetectedFace> faces = new ArrayList<>();
                int[] strides = {8, 16, 32};
                
                // det_500m.onnx outputs are 9 tensors: 3 strides x (scores, boxes, keypoints)
                if (results.size() != 9) {
                    log.error("Unexpected detection model output count: {}", results.size());
                    return faces;
                }

                for (int scaleIdx = 0; scaleIdx < 3; scaleIdx++) {
                    float[][] scores = getFloat2DArray(results.get(scaleIdx).getValue());
                    float[][] boxes = getFloat2DArray(results.get(scaleIdx + 3).getValue());
                    float[][] landmarks = getFloat2DArray(results.get(scaleIdx + 6).getValue());

                    int stride = strides[scaleIdx];
                    int totalAnchors = scores.length;
                    int featH = DET_INPUT_SIZE / stride;
                    int featW = DET_INPUT_SIZE / stride;
                    int gridPositions = featH * featW;

                    int numAnchorsPerPos = Math.max(1, totalAnchors / gridPositions);

                    for (int i = 0; i < totalAnchors; i++) {
                        float score = scores[i][0];
                        if (score >= threshold) {
                            int gridIndex = i / numAnchorsPerPos;
                            int anchorY = gridIndex / featW;
                            int anchorX = gridIndex % featW;
                            float anchorCenterX = anchorX * stride;
                            float anchorCenterY = anchorY * stride;

                            float leftDist = boxes[i][0] * stride;
                            float topDist = boxes[i][1] * stride;
                            float rightDist = boxes[i][2] * stride;
                            float bottomDist = boxes[i][3] * stride;

                            float x1Model = anchorCenterX - leftDist;
                            float y1Model = anchorCenterY - topDist;
                            float x2Model = anchorCenterX + rightDist;
                            float y2Model = anchorCenterY + bottomDist;

                            // Scale coordinates back to original image
                            float x1 = x1Model / scale;
                            float y1 = y1Model / scale;
                            float x2 = x2Model / scale;
                            float y2 = y2Model / scale;

                            // Clamp bounds
                            x1 = Math.max(0, Math.min(x1, sourceWidth));
                            y1 = Math.max(0, Math.min(y1, sourceHeight));
                            x2 = Math.max(0, Math.min(x2, sourceWidth));
                            y2 = Math.max(0, Math.min(y2, sourceHeight));

                            if ((x2 - x1) < 15 || (y2 - y1) < 15) {
                                continue;
                            }

                            // Extract landmarks
                            float[] decodedLandmarks = new float[10];
                            for (int j = 0; j < 5; j++) {
                                float lmXModel = anchorCenterX + landmarks[i][j * 2] * stride;
                                float lmYModel = anchorCenterY + landmarks[i][j * 2 + 1] * stride;
                                decodedLandmarks[j * 2] = Math.max(0, Math.min(lmXModel / scale, sourceWidth));
                                decodedLandmarks[j * 2 + 1] = Math.max(0, Math.min(lmYModel / scale, sourceHeight));
                            }

                            faces.add(new DetectedFace(x1, y1, x2, y2, score, decodedLandmarks));
                        }
                    }
                }

                // Apply NMS to remove duplicates
                if (!faces.isEmpty()) {
                    faces = applyNMS(faces, 0.4f);
                }
                return faces;
            }
        }
    }

    /**
     * Extracts face embedding from a cropped region of the image.
     */
    private float[] extractEmbedding(BufferedImage sourceImage, DetectedFace face) throws OrtException {
        // Crop the detected face
        int x = (int) face.x1;
        int y = (int) face.y1;
        int w = (int) (face.x2 - face.x1);
        int h = (int) (face.y2 - face.y1);

        int imgW = sourceImage.getWidth();
        int imgH = sourceImage.getHeight();

        // Guard bounds
        x = Math.max(0, Math.min(x, imgW - 1));
        y = Math.max(0, Math.min(y, imgH - 1));
        w = Math.max(1, Math.min(w, imgW - x));
        h = Math.max(1, Math.min(h, imgH - y));

        BufferedImage cropped = sourceImage.getSubimage(x, y, w, h);

        // Resize cropped face to 112x112
        BufferedImage resizedFace = new BufferedImage(REC_INPUT_SIZE, REC_INPUT_SIZE, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = resizedFace.createGraphics();
        g.drawImage(cropped, 0, 0, REC_INPUT_SIZE, REC_INPUT_SIZE, null);
        g.dispose();

        // Convert to input float array
        float[] inputData = new float[3 * REC_INPUT_SIZE * REC_INPUT_SIZE];
        int[] pixels = resizedFace.getRGB(0, 0, REC_INPUT_SIZE, REC_INPUT_SIZE, null, 0, REC_INPUT_SIZE);

        // Normalization for ArcFace/MobileFaceNet: (pixel - 127.5) / 127.5
        for (int i = 0; i < pixels.length; i++) {
            int pixel = pixels[i];
            int r = (pixel >> 16) & 0xFF;
            int gVal = (pixel >> 8) & 0xFF;
            int b = pixel & 0xFF;

            inputData[i] = (r - 127.5f) / 127.5f;
            inputData[pixels.length + i] = (gVal - 127.5f) / 127.5f;
            inputData[2 * pixels.length + i] = (b - 127.5f) / 127.5f;
        }

        long[] shape = {1, 3, REC_INPUT_SIZE, REC_INPUT_SIZE};
        try (OnnxTensor inputTensor = OnnxTensor.createTensor(env, FloatBuffer.wrap(inputData), shape)) {
            String inputName = recSession.getInputNames().iterator().next();
            try (OrtSession.Result results = recSession.run(Collections.singletonMap(inputName, inputTensor))) {
                float[][] rawEmbedding = (float[][]) results.get(0).getValue();
                return l2Normalize(rawEmbedding[0]);
            }
        }
    }

    /**
     * Decodes the raw tensor value, wrapping both 2D and 3D output cases.
     */
    private float[][] getFloat2DArray(Object value) {
        if (value instanceof float[][]) {
            return (float[][]) value;
        } else if (value instanceof float[][][]) {
            float[][][] val3d = (float[][][]) value;
            if (val3d.length > 0) {
                return val3d[0];
            }
        }
        throw new IllegalArgumentException("Unsupported output tensor type: " + value.getClass().getName());
    }

    private List<DetectedFace> applyNMS(List<DetectedFace> faces, float iouThreshold) {
        faces.sort((a, b) -> Float.compare(b.score, a.score));

        List<DetectedFace> result = new ArrayList<>();
        boolean[] suppressed = new boolean[faces.size()];

        for (int i = 0; i < faces.size(); i++) {
            if (suppressed[i]) continue;

            result.add(faces.get(i));
            DetectedFace faceA = faces.get(i);

            for (int j = i + 1; j < faces.size(); j++) {
                if (suppressed[j]) continue;

                DetectedFace faceB = faces.get(j);
                float iou = calculateIoU(faceA, faceB);

                if (iou > iouThreshold) {
                    suppressed[j] = true;
                }
            }
        }

        return result;
    }

    private float calculateIoU(DetectedFace a, DetectedFace b) {
        float intersectLeft = Math.max(a.x1, b.x1);
        float intersectTop = Math.max(a.y1, b.y1);
        float intersectRight = Math.min(a.x2, b.x2);
        float intersectBottom = Math.min(a.y2, b.y2);

        float intersectWidth = Math.max(0, intersectRight - intersectLeft);
        float intersectHeight = Math.max(0, intersectBottom - intersectTop);
        float intersectArea = intersectWidth * intersectHeight;

        float areaA = (a.x2 - a.x1) * (a.y2 - a.y1);
        float areaB = (b.x2 - b.x1) * (b.y2 - b.y1);
        float unionArea = areaA + areaB - intersectArea;

        if (unionArea == 0) return 0.0f;
        return intersectArea / unionArea;
    }

    private float[] l2Normalize(float[] embedding) {
        float norm = 0.0f;
        for (float val : embedding) {
            norm += val * val;
        }
        norm = (float) Math.sqrt(norm);
        
        if (norm > 0) {
            float[] normalized = new float[embedding.length];
            for (int i = 0; i < embedding.length; i++) {
                normalized[i] = embedding[i] / norm;
            }
            return normalized;
        }
        return embedding;
    }
}

