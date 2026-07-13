package com.findmyshot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobStatusResponse {
    private boolean found;
    private String id;
    private String status;
    private String createdAt;
    private Object result;
    private String error;
}

