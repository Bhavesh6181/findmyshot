package com.findmyshot.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeleteEventResponse {
    private boolean success;
    private int deletedPhotos;
}

