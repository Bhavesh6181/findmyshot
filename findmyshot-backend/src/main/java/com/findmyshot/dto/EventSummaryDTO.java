package com.findmyshot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventSummaryDTO {
    private String name;
    private String code;
    private int photoCount;
    private String createdAt;
    private String updatedAt;
}

