package com.findmyshot.service;

import com.findmyshot.dto.*;
import com.findmyshot.model.Event;
import com.findmyshot.repository.EventRepository;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class EventService {

    private final EventRepository eventRepository;
    private final MongoTemplate mongoTemplate;
    private final SecureRandom random = new SecureRandom();
    private static final String CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    public EventService(EventRepository eventRepository, MongoTemplate mongoTemplate) {
        this.eventRepository = eventRepository;
        this.mongoTemplate = mongoTemplate;
    }

    /**
     * Lists all events ordered by updatedAt desc, then createdAt desc.
     */
    public EventListResponse listEvents(int skip, int limit) {
        Sort sort = Sort.by(Sort.Direction.DESC, "updatedAt", "createdAt");
        Query query = new Query().with(sort).skip(skip).limit(limit);
        List<Event> events = mongoTemplate.find(query, Event.class);

        List<EventSummaryDTO> summaries = events.stream()
                .map(e -> EventSummaryDTO.builder()
                        .name(e.getName() != null ? e.getName() : e.getCode())
                        .code(e.getCode())
                        .photoCount(e.getPhotos() != null ? e.getPhotos().size() : 0)
                        .createdAt(e.getCreatedAt() != null ? e.getCreatedAt().toString() : null)
                        .updatedAt(e.getUpdatedAt() != null ? e.getUpdatedAt().toString() : 
                                  (e.getCreatedAt() != null ? e.getCreatedAt().toString() : null))
                        .build()
                ).collect(Collectors.toList());

        return new EventListResponse(summaries);
    }

    /**
     * Creates a new event with auto-generated 8-character alphanumeric code.
     */
    public CreateEventResponse createEvent(CreateEventRequest request) {
        String name = request.getName().trim();
        if (name.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Event name cannot be empty");
        }

        String code;
        int attempts = 0;
        do {
            code = generateEventCode();
            attempts++;
            if (attempts > 10) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to generate unique event code");
            }
        } while (eventRepository.findByCode(code).isPresent());

        Instant now = Instant.now();
        Event event = new Event();
        event.setName(name);
        event.setCode(code);
        event.setCreatedAt(now);
        event.setUpdatedAt(now);
        event.setPhotos(new ArrayList<>());

        Event saved = eventRepository.save(event);

        EventSummaryDTO summary = EventSummaryDTO.builder()
                .name(saved.getName())
                .code(saved.getCode())
                .photoCount(0)
                .createdAt(saved.getCreatedAt().toString())
                .updatedAt(saved.getUpdatedAt().toString())
                .build();

        return CreateEventResponse.builder()
                .success(true)
                .event(summary)
                .requestId(null)
                .build();
    }

    /**
     * Gets event details by code.
     */
    public EventDetailsResponse getEvent(String code) {
        Event event = eventRepository.findByCode(code.toUpperCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));

        List<EventPhotoDTO> photos = event.getPhotos() == null ? new ArrayList<>() :
                event.getPhotos().stream().map(p -> EventPhotoDTO.builder()
                        .url(p.getUrl())
                        .cloudinaryId(p.getCloudinaryId())
                        .filename(p.getFilename())
                        .facesFound(p.getFaceEmbeddings() != null ? p.getFaceEmbeddings().size() : 0)
                        .uploadedAt(p.getUploadedAt() != null ? p.getUploadedAt().toString() : null)
                        .build()
                ).collect(Collectors.toList());

        EventDetailsDTO details = EventDetailsDTO.builder()
                .name(event.getName() != null ? event.getName() : event.getCode())
                .code(event.getCode())
                .createdAt(event.getCreatedAt() != null ? event.getCreatedAt().toString() : null)
                .updatedAt(event.getUpdatedAt() != null ? event.getUpdatedAt().toString() : null)
                .photoCount(photos.size())
                .photos(photos)
                .build();

        return new EventDetailsResponse(details);
    }

    /**
     * Deletes an event by code.
     */
    public DeleteEventResponse deleteEvent(String code) {
        Event event = eventRepository.findByCode(code.toUpperCase()).orElse(null);
        if (event == null) {
            return new DeleteEventResponse(true, 0);
        }

        int photoCount = event.getPhotos() != null ? event.getPhotos().size() : 0;
        eventRepository.delete(event);
        return new DeleteEventResponse(true, photoCount);
    }

    private String generateEventCode() {
        StringBuilder sb = new StringBuilder(8);
        for (int i = 0; i < 8; i++) {
            sb.append(CHARS.charAt(random.nextInt(CHARS.length())));
        }
        return sb.toString();
    }
}

