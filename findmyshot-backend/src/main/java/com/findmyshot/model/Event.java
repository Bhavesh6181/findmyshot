package com.findmyshot.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "events")
@CompoundIndexes({
    @CompoundIndex(name = "idx_photo_cloudinary_id", def = "{'photos.cloudinary_id': 1}")
})
public class Event {
    @Id
    private String id;

    @Indexed(unique = true)
    private String code;

    private String name;

    private Instant createdAt;

    @Indexed
    private Instant updatedAt;

    private List<Photo> photos = new ArrayList<>();
}

