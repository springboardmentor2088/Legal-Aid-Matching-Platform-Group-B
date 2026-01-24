package com.jurify.jurify_backend.controller;

import com.jurify.jurify_backend.dto.admin.AdminStatsDTO;
import com.jurify.jurify_backend.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final com.jurify.jurify_backend.service.DirectoryEntryService directoryEntryService;

    @GetMapping("/directory")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<org.springframework.data.domain.Page<com.jurify.jurify_backend.model.DirectoryEntry>> getDirectoryEntries(
            @org.springframework.web.bind.annotation.RequestParam(required = false) String q,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String state,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String city,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String type,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String specialization,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "0") int page,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "10") int size) {

        // isVerified = null means return BOTH verified and unverified
        return ResponseEntity
                .ok(directoryEntryService.searchDirectory(q, state, city, type, specialization, null, null, null, null,
                        null, null, null, page, size));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminStatsDTO> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<org.springframework.data.domain.Page<com.jurify.jurify_backend.dto.admin.AdminUserDTO>> getUsers(
            org.springframework.data.domain.Pageable pageable,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String search) {
        return ResponseEntity.ok(adminService.getUsers(pageable, search));
    }

    @org.springframework.web.bind.annotation.PostMapping("/users/{id}/verify")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> verifyUser(@org.springframework.web.bind.annotation.PathVariable Long id) {
        adminService.verifyUser(id);
        return ResponseEntity.ok().build();
    }

    @org.springframework.web.bind.annotation.PutMapping("/users/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> updateUserStatus(
            @org.springframework.web.bind.annotation.PathVariable Long id,
            @org.springframework.web.bind.annotation.RequestParam String status,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String reason) {
        adminService.updateUserStatus(id, status, reason);
        return ResponseEntity.ok().build();
    }

    @org.springframework.web.bind.annotation.PostMapping("/users/bulk-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> bulkUpdateStatus(
            @org.springframework.web.bind.annotation.RequestBody com.jurify.jurify_backend.dto.admin.BulkStatusRequest request) {
        adminService.bulkUpdateStatus(request.getUserIds(), request.getStatus(), request.getReason());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<com.jurify.jurify_backend.dto.admin.AdminUserDTO> getUserDetails(
            @org.springframework.web.bind.annotation.PathVariable Long id) {
        return ResponseEntity.ok(adminService.getUserDetails(id));
    }

    @GetMapping("/users/{id}/documents")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<java.util.List<java.util.Map<String, String>>> getUserDocuments(
            @org.springframework.web.bind.annotation.PathVariable Long id) {
        return ResponseEntity.ok(adminService.getUserDocuments(id));
    }

    @GetMapping("/users/{id}/cases")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<org.springframework.data.domain.Page<com.jurify.jurify_backend.dto.admin.AdminCaseDTO>> getUserCases(
            @org.springframework.web.bind.annotation.PathVariable Long id,
            org.springframework.data.domain.Pageable pageable) {
        return ResponseEntity.ok(adminService.getUserCases(id, pageable));
    }

    @GetMapping("/audit-logs")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAuditLogs(
            @org.springframework.web.bind.annotation.RequestParam java.util.Map<String, String> params) {

        System.out.println("DEBUG: getAuditLogs called with params: " + params);

        try {
            String startStr = params.get("from");
            String endStr = params.get("to");
            String actionReq = params.get("action");
            String roleReq = params.get("role");

            int page = 0;
            int size = 20;

            try {
                if (params.get("page") != null)
                    page = Integer.parseInt(params.get("page"));
                if (params.get("size") != null)
                    size = Integer.parseInt(params.get("size"));
            } catch (NumberFormatException e) {
                // Keep defaults
            }

            org.springframework.data.domain.Pageable pageReq = org.springframework.data.domain.PageRequest.of(page,
                    size);

            // Parse dates if provided
            java.time.LocalDateTime startDateTime = null;
            java.time.LocalDateTime endDateTime = null;

            if (startStr != null && !startStr.isEmpty()) {
                try {
                    startDateTime = java.time.OffsetDateTime.parse(startStr).toLocalDateTime();
                } catch (Exception e1) {
                    try {
                        startDateTime = java.time.LocalDateTime.parse(startStr,
                                java.time.format.DateTimeFormatter.ISO_DATE_TIME);
                    } catch (Exception e2) {
                        try {
                            startDateTime = java.time.LocalDate.parse(startStr).atStartOfDay();
                        } catch (Exception e3) {
                            System.err.println("DEBUG: Failed to parse startDate: " + startStr);
                        }
                    }
                }
            }

            if (endStr != null && !endStr.isEmpty()) {
                try {
                    endDateTime = java.time.OffsetDateTime.parse(endStr).toLocalDateTime();
                } catch (Exception e1) {
                    try {
                        endDateTime = java.time.LocalDateTime.parse(endStr,
                                java.time.format.DateTimeFormatter.ISO_DATE_TIME);
                    } catch (Exception e2) {
                        try {
                            endDateTime = java.time.LocalDate.parse(endStr).atTime(23, 59, 59);
                        } catch (Exception e3) {
                            System.err.println("DEBUG: Failed to parse endDate: " + endStr);
                        }
                    }
                }
            }

            // If any filter is provided, use filtered method
            if (startDateTime != null || endDateTime != null || (actionReq != null && !actionReq.isEmpty())
                    || (roleReq != null && !roleReq.isEmpty())) {
                return ResponseEntity
                        .ok(adminService.getAuditLogsFiltered(startDateTime, endDateTime, actionReq, roleReq, pageReq));
            }
            return ResponseEntity.ok(adminService.getAuditLogs(pageReq));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error processing audit logs: " + e.getMessage());
        }
    }

    @GetMapping("/audit-logs/actions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<java.util.List<String>> getDistinctAuditActions() {
        return ResponseEntity.ok(adminService.getDistinctAuditActions());
    }

    @GetMapping("/cases")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<org.springframework.data.domain.Page<com.jurify.jurify_backend.dto.admin.AdminCaseDTO>> getCases(
            org.springframework.data.domain.Pageable pageable) {
        return ResponseEntity.ok(adminService.getAllCases(pageable));
    }

    @GetMapping("/insights")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<com.jurify.jurify_backend.dto.admin.AdminInsightsDTO> getInsights() {
        return ResponseEntity.ok(adminService.getInsights());
    }
}
