package com.findmyshot.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchRequest {
    @NotBlank(message = "Selfie image (base64) is required")
    private String selfieBase64;

    private String eventCode;

    @JsonProperty("eventId")
    private String eventId;

    public String getEventCodeToUse() {
        return (eventCode != null && !eventCode.trim().isEmpty()) ? eventCode : eventId;
    }
}

