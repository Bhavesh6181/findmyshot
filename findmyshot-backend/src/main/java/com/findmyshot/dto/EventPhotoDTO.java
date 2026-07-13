package com.findmyshot.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventPhotoDTO {
    @JsonProperty("cloudinary_url")
    private String url;

    @JsonProperty("cloudinary_id")
    private String cloudinaryId;

    private String filename;
    private int facesFound;
    private String uploadedAt;
}

