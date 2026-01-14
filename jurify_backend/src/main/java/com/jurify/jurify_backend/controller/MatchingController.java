package com.jurify.jurify_backend.controller;

import com.jurify.jurify_backend.service.MatchingEngineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
public class MatchingController {

    private final MatchingEngineService matchingEngineService;

    @PostMapping("/case/{caseId}/generate")
    public ResponseEntity<List<com.jurify.jurify_backend.dto.MatchResponseDTO>> generateMatches(
            @PathVariable Long caseId) {
        return ResponseEntity.ok(matchingEngineService.generateMatches(caseId));
    }

    @GetMapping("/case/{caseId}")
    public ResponseEntity<List<com.jurify.jurify_backend.dto.MatchResponseDTO>> getMatches(@PathVariable Long caseId) {
        return ResponseEntity.ok(matchingEngineService.generateMatches(caseId));
    }
}
