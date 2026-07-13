package com.findmyshot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateEventResponse {
    private boolean success;
    private EventSummaryDTO event;
    private String requestId;
}

