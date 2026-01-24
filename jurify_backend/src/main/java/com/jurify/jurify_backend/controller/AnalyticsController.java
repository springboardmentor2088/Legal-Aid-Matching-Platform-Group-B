package com.jurify.jurify_backend.controller;

import com.jurify.jurify_backend.dto.analytics.LeaderboardEntryDTO;
import com.jurify.jurify_backend.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    private final com.jurify.jurify_backend.repository.UserRepository userRepository;
    private final com.jurify.jurify_backend.repository.LawyerRepository lawyerRepository;
    private final com.jurify.jurify_backend.repository.CitizenRepository citizenRepository;

    @GetMapping("/leaderboard/lawyers")
    public ResponseEntity<List<LeaderboardEntryDTO>> getTopLawyers(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(analyticsService.getTopLawyers(limit));
    }

    @GetMapping("/leaderboard/ngos")
    public ResponseEntity<List<LeaderboardEntryDTO>> getTopNGOs(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(analyticsService.getTopNGOs(limit));
    }

    @org.springframework.security.access.prepost.PreAuthorize("hasRole('LAWYER')")
    @GetMapping("/lawyer/insights")
    public ResponseEntity<com.jurify.jurify_backend.dto.analytics.LawyerInsightsDTO> getLawyerInsights(
            java.security.Principal principal) {
        com.jurify.jurify_backend.model.User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        com.jurify.jurify_backend.model.Lawyer lawyer = lawyerRepository.findByUser_Id(user.getId())
                .orElseThrow(() -> new RuntimeException("Lawyer profile not found"));

        return ResponseEntity.ok(analyticsService.getLawyerInsights(lawyer.getId()));
    }

    @org.springframework.security.access.prepost.PreAuthorize("hasRole('CITIZEN')")
    @GetMapping("/citizen/insights")
    public ResponseEntity<com.jurify.jurify_backend.dto.analytics.CitizenInsightsDTO> getCitizenInsights(
            java.security.Principal principal) {
        com.jurify.jurify_backend.model.User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        com.jurify.jurify_backend.model.Citizen citizen = citizenRepository.findByUser_Id(user.getId())
                .orElseThrow(() -> new RuntimeException("Citizen profile not found"));

        return ResponseEntity.ok(analyticsService.getCitizenInsights(citizen.getId()));
    }
}
