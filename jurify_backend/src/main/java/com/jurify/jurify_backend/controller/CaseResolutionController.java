package com.jurify.jurify_backend.controller;

import com.jurify.jurify_backend.dto.case_management.ResolutionResponseDTO;
import com.jurify.jurify_backend.service.LegalCaseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/cases")
@RequiredArgsConstructor
public class CaseResolutionController {

    private final LegalCaseService legalCaseService;

    /**
     * Lawyer/NGO submits resolution for a case with a document
     */
    @PostMapping(value = "/{caseId}/submit-resolution", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResolutionResponseDTO> submitResolution(
            @PathVariable Long caseId,
            @AuthenticationPrincipal String email,
            @RequestPart("document") MultipartFile document,
            @RequestPart(value = "notes", required = false) String notes) {

        System.out.println("DEBUG: submitResolution called for case " + caseId + " by " + email);
        if (document != null) {
            System.out.println(
                    "DEBUG: Document received: " + document.getOriginalFilename() + ", size=" + document.getSize());
        } else {
            System.out.println("DEBUG: Document is NULL");
        }

        ResolutionResponseDTO response = legalCaseService.submitResolution(caseId, email, document, notes);
        return ResponseEntity.ok(response);
    }

    /**
     * Citizen acknowledges the resolution to complete the case
     */
    @PostMapping("/{caseId}/acknowledge-resolution")
    public ResponseEntity<ResolutionResponseDTO> acknowledgeResolution(
            @PathVariable Long caseId,
            @AuthenticationPrincipal String email,
            @RequestBody(required = false) com.jurify.jurify_backend.dto.case_resolution.ResolutionAcknowledgmentDTO acknowledgmentDTO) {

        ResolutionResponseDTO response = legalCaseService.acknowledgeResolution(caseId, email, acknowledgmentDTO);
        return ResponseEntity.ok(response);
    }

    /**
     * Get resolution details for a case
     */
    @GetMapping("/{caseId}/resolution")
    public ResponseEntity<ResolutionResponseDTO> getResolution(
            @PathVariable Long caseId,
            @AuthenticationPrincipal String email) {

        ResolutionResponseDTO response = legalCaseService.getResolutionDetails(caseId, email);
        return ResponseEntity.ok(response);
    }
}
