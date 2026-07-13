package com.findmyshot.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class HealthController {

    private final MongoTemplate mongoTemplate;

    @Value("${cloudinary.cloud-name:}")
    private String cloudinaryCloudName;

    @Value("${cloudinary.api-key:}")
    private String cloudinaryApiKey;

    @Value("${cloudinary.api-secret:}")
    private String cloudinaryApiSecret;

    public HealthController(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @GetMapping("/healthz")
    public Map<String, Object> healthz() {
        Map<String, Object> response = new HashMap<>();
        boolean mongoOk = false;
        String mongoError = null;
        try {
            // Simple ping to check MongoDB connection status
            mongoTemplate.executeCommand("{ping: 1}");
            mongoOk = true;
        } catch (Exception e) {
            mongoError = e.getMessage();
        }

        boolean cloudinaryConfigured = cloudinaryCloudName != null && !cloudinaryCloudName.isEmpty()
                && cloudinaryApiKey != null && !cloudinaryApiKey.isEmpty()
                && cloudinaryApiSecret != null && !cloudinaryApiSecret.isEmpty();

        response.put("status", mongoOk ? "ok" : "degraded");
        
        Map<String, Object> mongoMap = new HashMap<>();
        mongoMap.put("ok", mongoOk);
        mongoMap.put("error", mongoError);
        response.put("mongo", mongoMap);
        
        response.put("cloudinaryConfigured", cloudinaryConfigured);

        return response;
    }
}

