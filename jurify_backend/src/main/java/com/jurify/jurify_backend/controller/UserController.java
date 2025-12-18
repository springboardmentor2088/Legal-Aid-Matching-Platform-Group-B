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

    @GetMapping("/me")
    public ResponseEntity<com.jurify.jurify_backend.dto.auth.AuthResponse> getMe(Principal principal) {
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(userService.getCurrentUserResponse(user));
    }
}
