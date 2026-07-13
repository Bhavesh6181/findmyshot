package com.findmyshot.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProcessPhotoRequest {
    private String url;

    @JsonProperty("cloudinaryUrl")
    private String cloudinaryUrl;

    @NotBlank(message = "Cloudinary ID is required")
    @JsonProperty("cloudinaryId")
    private String cloudinaryId;

    @NotBlank(message = "Event code is required")
    private String eventCode;

    private String filename;

    public String getUrlToUse() {
        return (url != null && !url.trim().isEmpty()) ? url : cloudinaryUrl;
    }
}

