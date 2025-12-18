package com.jurify.jurify_backend.controller;

import com.jurify.jurify_backend.dto.VerificationRequestDTO;
import com.jurify.jurify_backend.model.User;
import com.jurify.jurify_backend.model.VerificationRequest;
import com.jurify.jurify_backend.service.VerificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.jurify.jurify_backend.repository.UserRepository;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/verification")
@RequiredArgsConstructor
public class VerificationController {

    private final VerificationService verificationService;
    private final UserRepository userRepository;

    @PostMapping("/submit")
    public ResponseEntity<VerificationRequest> submitVerification(@Valid @RequestBody VerificationRequestDTO requestDTO,
            Principal principal) {
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(verificationService.submitVerificationRequest(user.getId(), requestDTO));
    }

    @GetMapping("/pending")
    public ResponseEntity<List<VerificationRequest>> getPendingRequests() {
        return ResponseEntity.ok(verificationService.getPendingRequests());
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<VerificationRequest> approveRequest(@PathVariable Long id,
            Principal principal) {
        User admin = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        return ResponseEntity.ok(verificationService.approveRequest(id, admin.getId()));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<VerificationRequest> rejectRequest(@PathVariable Long id,
            @RequestBody Map<String, String> body,
            Principal principal) {
        User admin = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        String reason = body.get("reason");

        return ResponseEntity.ok(verificationService.rejectRequest(id, admin.getId(), reason));
    }
}
