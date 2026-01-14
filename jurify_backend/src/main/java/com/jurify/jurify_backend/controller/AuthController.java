package com.jurify.jurify_backend.controller;

import com.jurify.jurify_backend.dto.auth.AuthResponse;
import com.jurify.jurify_backend.dto.auth.LoginRequest;
import com.jurify.jurify_backend.dto.auth.RefreshTokenRequest;
import com.jurify.jurify_backend.service.AuthenticationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthenticationService authenticationService;
    private final com.jurify.jurify_backend.service.EmailService emailService;

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        try {
            AuthResponse response = authenticationService.login(request, httpRequest);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.warn("Login failed for email: {}: {}", request.getEmail(), e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(java.util.Collections.singletonMap("message", e.getMessage()));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request,
            HttpServletRequest httpRequest) {
        try {
            AuthResponse response = authenticationService.refreshToken(request, httpRequest);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Token refresh failed", e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody RefreshTokenRequest request) {
        try {
            authenticationService.logout(request.getRefreshToken());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Logout failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam String token) {
        try {
            AuthResponse response = authenticationService.verifyEmail(token);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(java.util.Collections.singletonMap("error", e.getMessage()));
        }
    }

    @PostMapping("/poll-verification")
    public ResponseEntity<AuthResponse> pollVerification(@RequestBody java.util.Map<String, String> request) {
        String pollingToken = request.get("pollingToken");
        if (pollingToken == null) {
            return ResponseEntity.badRequest().build();
        }

        AuthResponse response = authenticationService.pollVerification(pollingToken);
        if (response != null) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.ACCEPTED).build(); // 202 Accepted (Processing/Pending)
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody java.util.Map<String, String> request) {
        try {
            String email = request.get("email");
            if (email == null || email.isEmpty()) {
                return ResponseEntity.badRequest().body("Email is required");
            }
            authenticationService.forgotPassword(email);
            return ResponseEntity.ok("Password reset email sent");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody java.util.Map<String, String> request) {
        try {
            String token = request.get("token");
            String newPassword = request.get("newPassword");
            if (token == null || newPassword == null) {
                return ResponseEntity.badRequest().body("Token and new password are required");
            }
            authenticationService.resetPassword(token, newPassword);
            return ResponseEntity.ok("Password reset successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/contact-us")
    public ResponseEntity<String> contactUs(@RequestBody com.jurify.jurify_backend.dto.ContactUsRequest request) {
        try {
            if (request.getEmail() == null || request.getMessage() == null) {
                return ResponseEntity.badRequest().body("Email and Message are required");
            }
            emailService.sendContactUsEmail(request.getEmail(), request.getName(), request.getSubject(),
                    request.getMessage());
            return ResponseEntity.ok("Message sent successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to send message: " + e.getMessage());
        }
    }
}
