package com.jurify.jurify_backend.controller;

import com.jurify.jurify_backend.dto.ConsultationLeadDTO;
import com.jurify.jurify_backend.service.ConsultationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/consultation")
@RequiredArgsConstructor
public class ConsultationController {

    private final ConsultationService consultationService;

    @PostMapping("/request/{caseId}/{providerId}")
    public ResponseEntity<String> requestConsultation(@AuthenticationPrincipal String email,
            @PathVariable Long caseId,
            @PathVariable Long providerId,
            @RequestParam String providerType) {
        consultationService.requestConsultation(email, caseId, providerId, providerType);
        return ResponseEntity.ok("Consultation requested successfully");
    }

    @PostMapping("/accept/{caseId}")
    public ResponseEntity<String> acceptConsultation(@AuthenticationPrincipal String email,
            @PathVariable Long caseId) {
        consultationService.acceptConsultation(email, caseId);
        return ResponseEntity.ok("Case accepted successfully");
    }

    @PostMapping("/reject/{caseId}")
    public ResponseEntity<String> rejectConsultation(@AuthenticationPrincipal String email,
            @PathVariable Long caseId) {
        consultationService.rejectConsultation(email, caseId);
        return ResponseEntity.ok("Case rejected successfully");
    }

    @GetMapping("/leads")
    public ResponseEntity<List<ConsultationLeadDTO>> getLeads(@AuthenticationPrincipal String email) {
        return ResponseEntity.ok(consultationService.getLeads(email));
    }

    @GetMapping("/my-consultations")
    public ResponseEntity<List<ConsultationLeadDTO>> getMyConsultations(@AuthenticationPrincipal String email) {
        return ResponseEntity.ok(consultationService.getCitizenConsultations(email));
    }
}
