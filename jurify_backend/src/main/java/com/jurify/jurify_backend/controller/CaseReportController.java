package com.jurify.jurify_backend.controller;

import com.jurify.jurify_backend.model.CaseReport;
import com.jurify.jurify_backend.service.CaseReportService;
import com.jurify.jurify_backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class CaseReportController {

    private final CaseReportService caseReportService;
    private final JwtUtil jwtUtil;

    @PostMapping
    public ResponseEntity<CaseReport> createReport(@RequestHeader("Authorization") String token,
            @RequestBody Map<String, Object> payload) {
        String jwt = token.replace("Bearer ", "");
        Long reporterId = jwtUtil.extractUserId(jwt);

        Long caseId = ((Number) payload.get("caseId")).longValue();
        String reason = (String) payload.get("reason");

        return ResponseEntity.ok(caseReportService.reportCase(caseId, reporterId, reason));
    }

    @GetMapping("/pending")
    public ResponseEntity<List<CaseReport>> getPendingReports(@RequestHeader("Authorization") String token) {
        // Verify Admin Role
        String jwt = token.replace("Bearer ", "");
        String role = jwtUtil.extractRole(jwt);
        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.ok(caseReportService.getPendingReports());
    }

    @PostMapping("/{reportId}/dismiss")
    public ResponseEntity<Void> dismissReport(@RequestHeader("Authorization") String token,
            @PathVariable Long reportId) {
        // Verify Admin Role and Extract ID
        String jwt = token.replace("Bearer ", "");
        String role = jwtUtil.extractRole(jwt);
        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(403).build();
        }
        Long adminId = jwtUtil.extractUserId(jwt);

        caseReportService.dismissReport(reportId, adminId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{reportId}/resolve")
    public ResponseEntity<Void> resolveReport(@RequestHeader("Authorization") String token,
            @PathVariable Long reportId,
            @RequestBody Map<String, String> payload) {
        // Verify Admin Role and Extract ID
        String jwt = token.replace("Bearer ", "");
        String role = jwtUtil.extractRole(jwt);
        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(403).build();
        }
        Long adminId = jwtUtil.extractUserId(jwt);

        String removalReason = payload.getOrDefault("removalReason", "Violation of platform policies.");
        caseReportService.resolveReportAndRemoveCase(reportId, removalReason, adminId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/history")
    public ResponseEntity<List<CaseReport>> getReportHistory(@RequestHeader("Authorization") String token) {
        // Verify Admin Role
        String jwt = token.replace("Bearer ", "");
        String role = jwtUtil.extractRole(jwt);
        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(caseReportService.getAllReports());
    }
}
