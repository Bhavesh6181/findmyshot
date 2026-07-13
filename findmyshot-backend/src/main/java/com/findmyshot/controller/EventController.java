package com.findmyshot.controller;

import com.findmyshot.dto.*;
import com.findmyshot.service.EventService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/events")
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping
    public EventListResponse listEvents(
            @RequestParam(defaultValue = "0") int skip,
            @RequestParam(defaultValue = "100") int limit) {
        return eventService.listEvents(skip, limit);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.OK) // FastAPI returns 200 OK by default unless exception thrown
    public CreateEventResponse createEvent(@Valid @RequestBody CreateEventRequest request) {
        return eventService.createEvent(request);
    }

    @GetMapping("/{code}")
    public EventDetailsResponse getEvent(@PathVariable String code) {
        return eventService.getEvent(code);
    }

    @DeleteMapping("/{code}")
    public DeleteEventResponse deleteEvent(@PathVariable String code) {
        return eventService.deleteEvent(code);
    }
}

