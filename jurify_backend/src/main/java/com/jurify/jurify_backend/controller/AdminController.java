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
