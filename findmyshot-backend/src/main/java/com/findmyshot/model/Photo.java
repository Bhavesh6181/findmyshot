package com.findmyshot.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Photo {
    @Field("cloudinary_id")
    private String cloudinaryId;

    @Field("cloudinary_url")
    private String url;

    @Field("face_embeddings")
    private List<float[]> faceEmbeddings = new ArrayList<>();

    private Instant uploadedAt;

    private String filename;
}

