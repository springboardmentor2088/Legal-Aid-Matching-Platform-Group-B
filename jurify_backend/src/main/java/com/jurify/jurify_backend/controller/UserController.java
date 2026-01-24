package com.jurify.jurify_backend.controller;

import com.jurify.jurify_backend.dto.LocationUpdateDTO;
import com.jurify.jurify_backend.model.User;
import com.jurify.jurify_backend.repository.UserRepository;
import com.jurify.jurify_backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final com.jurify.jurify_backend.service.DirectoryEntryService directoryEntryService;

    @PatchMapping("/directory-status")
    public ResponseEntity<Void> updateDirectoryStatus(@RequestBody java.util.Map<String, Boolean> statusUpdate,
            Principal principal) {
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Boolean isActive = statusUpdate.get("isActive");
        if (isActive == null) {
            throw new IllegalArgumentException("isActive field is required");
        }

        directoryEntryService.updateStatus(user, isActive);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/profile/location")
    public ResponseEntity<Void> updateProfileLocation(@Valid @RequestBody LocationUpdateDTO locationDTO,
            Principal principal) {
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        userService.updateProfileLocation(user.getId(), locationDTO);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/profile")
    public ResponseEntity<Void> updateProfile(
            @Valid @RequestBody com.jurify.jurify_backend.dto.ProfileUpdateDTO profileDTO,
            Principal principal) {
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        userService.updateProfile(user.getId(), profileDTO);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/profile/preferences")
    public ResponseEntity<Void> updatePreferences(
            @RequestBody java.util.Map<String, Object> preferences,
            Principal principal) {
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        userService.updatePreferences(user.getId(), preferences);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    public ResponseEntity<com.jurify.jurify_backend.dto.auth.AuthResponse> getMe(Principal principal) {
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(userService.getCurrentUserResponse(user));
    }

    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(@RequestBody java.util.Map<String, String> request,
            Principal principal) {
        String currentPassword = request.get("currentPassword");
        String newPassword = request.get("newPassword");

        if (currentPassword == null || newPassword == null) {
            throw new IllegalArgumentException("Current and new password are required");
        }

        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        userService.changePassword(user.getId(), currentPassword, newPassword);
        return ResponseEntity.ok().build();
    }
}
