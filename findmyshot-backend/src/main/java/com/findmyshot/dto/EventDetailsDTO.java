package com.findmyshot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventDetailsDTO {
    private String name;
    private String code;
    private String createdAt;
    private String updatedAt;
    private int photoCount;
    private List<EventPhotoDTO> photos;
}

