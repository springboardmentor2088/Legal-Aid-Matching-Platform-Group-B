package com.jurify.jurify_backend.controller;

import com.jurify.jurify_backend.model.LegalCategory;
import com.jurify.jurify_backend.repository.LegalCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class LegalCategoryController {

    private final LegalCategoryRepository legalCategoryRepository;

    @GetMapping
    public ResponseEntity<List<LegalCategory>> getAllCategories() {
        return ResponseEntity.ok(legalCategoryRepository.findByIsActiveTrueOrderByDisplayOrderAsc());
    }
}
