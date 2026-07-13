package com.findmyshot.controller;

import com.findmyshot.dto.MatchRequest;
import com.findmyshot.dto.MatchResponse;
import com.findmyshot.service.MatchService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MatchController {

    private final MatchService matchService;

    public MatchController(MatchService matchService) {
        this.matchService = matchService;
    }

    @PostMapping("/match")
    @ResponseStatus(HttpStatus.OK)
    public MatchResponse matchSelfie(@Valid @RequestBody MatchRequest request) {
        return matchService.matchSelfie(request);
    }
}

