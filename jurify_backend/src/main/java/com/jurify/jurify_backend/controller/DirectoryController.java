package com.jurify.jurify_backend.controller;

import com.jurify.jurify_backend.model.DirectoryEntry;
import com.jurify.jurify_backend.service.DirectoryEntryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public/directory")
@RequiredArgsConstructor
public class DirectoryController {

    private final DirectoryEntryService directoryEntryService;

    @GetMapping("/search")
    public ResponseEntity<org.springframework.data.domain.Page<DirectoryEntry>> searchDirectory(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String specialization,
            @RequestParam(required = false) Integer minExp,
            @RequestParam(required = false) Integer maxExp,
            @RequestParam(required = false) String minRating,
            @RequestParam(required = false) String maxRating,
            @RequestParam(required = false) String languages,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity
                .ok(directoryEntryService.searchDirectory(q, state, city, type, specialization, minExp, maxExp,
                        minRating, maxRating, languages, true, true, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DirectoryEntry> getDirectoryEntry(@PathVariable Long id) {
        return ResponseEntity.ok(directoryEntryService.getEntryById(id));
    }

    @GetMapping("/{id}/reviews")
    public ResponseEntity<List<com.jurify.jurify_backend.model.Review>> getReviews(@PathVariable Long id) {
        return ResponseEntity.ok(directoryEntryService.getReviews(id));
    }
}
