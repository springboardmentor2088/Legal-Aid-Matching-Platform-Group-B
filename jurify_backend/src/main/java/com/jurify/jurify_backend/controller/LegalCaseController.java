package com.jurify.jurify_backend.controller;

import com.jurify.jurify_backend.dto.case_management.CaseStatsDTO;
import com.jurify.jurify_backend.dto.case_management.LegalCaseDTO;
import com.jurify.jurify_backend.service.LegalCaseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/cases")
@RequiredArgsConstructor
public class LegalCaseController {

    private final LegalCaseService legalCaseService;

    @GetMapping
    public ResponseEntity<List<LegalCaseDTO>> getMyCases(@AuthenticationPrincipal String email) {
        return ResponseEntity.ok(legalCaseService.getCasesForUser(email));
    }

    @GetMapping("/stats")
    public ResponseEntity<CaseStatsDTO> getCaseStats(@AuthenticationPrincipal String email) {
        return ResponseEntity.ok(legalCaseService.getCaseStatsForUser(email));
    }
}
