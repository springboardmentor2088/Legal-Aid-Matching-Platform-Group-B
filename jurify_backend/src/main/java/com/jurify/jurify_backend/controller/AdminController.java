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
}
