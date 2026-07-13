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
public class MatchResponse {
    private List<MatchResult> matches;
    private List<MatchResult> photos; // Duplicate list for backwards compatibility
    private int totalScanned;
}

