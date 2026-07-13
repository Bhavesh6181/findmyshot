package com.findmyshot.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchResult {
    @JsonProperty("url")
    private String photoUrl;

    @JsonProperty("cloudinaryId")
    private String cloudinaryId;

    @JsonProperty("confidence")
    private double similarityScore;
}

