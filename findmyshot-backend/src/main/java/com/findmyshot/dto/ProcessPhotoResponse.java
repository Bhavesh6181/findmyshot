package com.findmyshot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessPhotoResponse {
    private boolean success;
    private int facesFound;
    private int facesDetected;
    private String url;
    private String cloudinaryId;
    /** True when face processing is still running in background (async mode). */
    private boolean processing;
    /** Job ID for async tracking (optional). */
    private String jobId;
}

