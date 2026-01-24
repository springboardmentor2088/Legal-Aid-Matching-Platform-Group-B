package com.jurify.jurify_backend.service;

import com.jurify.jurify_backend.dto.auth.AuthResponse;
import com.jurify.jurify_backend.dto.auth.LoginRequest;
import com.jurify.jurify_backend.dto.auth.RefreshTokenRequest;
import com.jurify.jurify_backend.model.EmailVerificationToken;
import com.jurify.jurify_backend.model.RefreshToken;
import com.jurify.jurify_backend.model.User;
import com.jurify.jurify_backend.repository.EmailVerificationTokenRepository;
import com.jurify.jurify_backend.repository.RefreshTokenRepository;
import com.jurify.jurify_backend.repository.UserRepository;
import com.jurify.jurify_backend.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final com.jurify.jurify_backend.repository.PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final MatchingEngineService matchingEngineService;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    private AuthResponse buildAuthResponse(User user, String accessToken, String refreshTokenValue) {
        AuthResponse.AuthResponseBuilder builder = AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenValue)
                .userId(user.getId())
                .email(user.getEmail())
                .role(user.getRole())
                .isEmailVerified(user.getIsEmailVerified())
                .firstName(getFirstName(user))
                .lastName(getLastName(user));

        if (user.getRole() == com.jurify.jurify_backend.model.enums.UserRole.CITIZEN && user.getCitizen() != null) {
            builder.languages(user.getCitizen().getLanguages())
                    .phone(user.getCitizen().getPhoneNumber())
                    .dob(user.getCitizen().getDateOfBirth() != null ? user.getCitizen().getDateOfBirth().toString()
                            : null)
                    .gender(user.getCitizen().getGender() != null ? user.getCitizen().getGender().name() : null)
                    .addressLine1(user.getCitizen().getAddressLine1())
                    .city(user.getCitizen().getLocation() != null ? user.getCitizen().getLocation().getCity() : null);
        } else if (user.getRole() == com.jurify.jurify_backend.model.enums.UserRole.LAWYER
                && user.getLawyer() != null) {
            builder.languages(user.getLawyer().getLanguages())
                    .phone(user.getLawyer().getPhoneNumber())
                    .barCouncilNumber(user.getLawyer().getBarCouncilNumber())
                    .barCouncilState(user.getLawyer().getBarCouncilState())
                    .yearsOfExperience(user.getLawyer().getYearsOfExperience())
                    .lawFirmName(user.getLawyer().getLawFirmName())
                    .bio(user.getLawyer().getBio());
            // Mapping specializations might require more logic/DTO change if we want list,
            // for now assuming languages are main request.
        } else if (user.getRole() == com.jurify.jurify_backend.model.enums.UserRole.NGO && user.getNgo() != null) {
            builder.languages(user.getNgo().getLanguages())
                    .phone(user.getNgo().getOrganizationPhone()) // Using org phone as main contact
                    .organizationPhone(user.getNgo().getOrganizationPhone())
                    .registrationNumber(user.getNgo().getRegistrationNumber())
                    .contactPersonName(user.getNgo().getContactPersonName());
        }
        if (user.getPreferences() != null) {
            try {
                java.util.Map<String, Object> prefs = objectMapper.readValue(user.getPreferences(),
                        java.util.Map.class);
                builder.preferences(prefs);
            } catch (Exception e) {
                log.error("Failed to parse user preferences", e);
            }
        }

        return builder.build();
    }

    @Transactional
    public void changePassword(String email, String currentPassword, String newPassword) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new RuntimeException("Invalid current password");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        User user = userRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid email or password");
        }

        if (!user.getIsActive()) {
            throw new RuntimeException("Account is deactivated");
        }

        if (!user.getIsEmailVerified()) {
            throw new RuntimeException("Email not verified. Please verify your email.");
        }

        // Update last login
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        // Generate tokens
        String accessToken = jwtUtil.generateAccessToken(
                user.getId(),
                user.getEmail(),
                user.getRole().name());

        String refreshTokenValue = jwtUtil.generateRefreshToken(user.getId(), user.getEmail());

        // Save refresh token
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(refreshTokenValue)
                .expiresAt(LocalDateTime.now().plusSeconds(jwtUtil.getRefreshExpiration() / 1000))
                .ipAddress(getClientIpAddress(httpRequest))
                .userAgent(httpRequest.getHeader("User-Agent"))
                .isRevoked(false)
                .build();

        refreshTokenRepository.save(refreshToken);

        return buildAuthResponse(user, accessToken, refreshTokenValue);
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request, HttpServletRequest httpRequest) {
        // Validate refresh token
        RefreshToken refreshToken = refreshTokenRepository
                .findByTokenAndIsRevokedFalse(request.getRefreshToken())
                .orElseThrow(() -> new RuntimeException("Invalid refresh token"));

        if (refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Refresh token has expired");
        }

        User user = refreshToken.getUser();

        if (!user.getIsActive()) {
            throw new RuntimeException("Account is deactivated");
        }

        // Revoke old refresh token
        refreshToken.setIsRevoked(true);
        refreshTokenRepository.save(refreshToken);

        // Generate new tokens
        String newAccessToken = jwtUtil.generateAccessToken(
                user.getId(),
                user.getEmail(),
                user.getRole().name());

        String newRefreshTokenValue = jwtUtil.generateRefreshToken(user.getId(), user.getEmail());

        // Save new refresh token
        RefreshToken newRefreshToken = RefreshToken.builder()
                .user(user)
                .token(newRefreshTokenValue)
                .expiresAt(LocalDateTime.now().plusSeconds(jwtUtil.getRefreshExpiration() / 1000))
                .ipAddress(getClientIpAddress(httpRequest))
                .userAgent(httpRequest.getHeader("User-Agent"))
                .isRevoked(false)
                .build();

        refreshTokenRepository.save(newRefreshToken);

        return buildAuthResponse(user, newAccessToken, newRefreshTokenValue);
    }

    @Transactional
    public AuthResponse verifyEmail(String token) {
        EmailVerificationToken verificationToken = emailVerificationTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid verification token"));

        if (verificationToken.getIsUsed()) {
            throw new RuntimeException("Token already used");
        }

        if (verificationToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Token expired");
        }

        User user = verificationToken.getUser();
        user.setIsEmailVerified(true);
        userRepository.save(user);

        verificationToken.setIsUsed(true);
        emailVerificationTokenRepository.save(verificationToken);

        // Trigger reverse matching for new providers
        try {
            if (user.getRole() == com.jurify.jurify_backend.model.enums.UserRole.LAWYER && user.getLawyer() != null) {
                matchingEngineService.generateMatchesForProvider(user.getLawyer().getId(), "LAWYER");
            } else if (user.getRole() == com.jurify.jurify_backend.model.enums.UserRole.NGO && user.getNgo() != null) {
                matchingEngineService.generateMatchesForProvider(user.getNgo().getId(), "NGO");
            }
        } catch (Exception e) {
            log.error("Error triggering reverse matching for user {}: {}", user.getId(), e.getMessage());
            // Don't fail the verification just because matching failed
        }

        // Auto-login logic (Generate tokens)
        String accessToken = jwtUtil.generateAccessToken(
                user.getId(),
                user.getEmail(),
                user.getRole().name());

        String refreshTokenValue = jwtUtil.generateRefreshToken(user.getId(), user.getEmail());

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(refreshTokenValue)
                .expiresAt(LocalDateTime.now().plusSeconds(jwtUtil.getRefreshExpiration() / 1000))
                .isRevoked(false)
                .build();
        // Note: IP and UserAgent are not available here easily without request context,
        // setting null or generic
        // If strictly required, we'd need to change method signature to accept
        // HttpServletRequest

        refreshTokenRepository.save(refreshToken);

        return buildAuthResponse(user, accessToken, refreshTokenValue);
    }

    @Transactional
    public void logout(String refreshToken) {
        Optional<RefreshToken> token = refreshTokenRepository.findByToken(refreshToken);
        if (token.isPresent()) {
            token.get().setIsRevoked(true);
            refreshTokenRepository.save(token.get());
        }
    }

    @Transactional
    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.getIsActive()) {
            throw new RuntimeException("Account is deactivated");
        }

        String token = java.util.UUID.randomUUID().toString();
        com.jurify.jurify_backend.model.PasswordResetToken resetToken = com.jurify.jurify_backend.model.PasswordResetToken
                .builder()
                .user(user)
                .token(token)
                .expiresAt(LocalDateTime.now().plusHours(1))
                .isUsed(false)
                .build();

        passwordResetTokenRepository.save(resetToken);
        emailService.sendPasswordResetEmail(user.getEmail(), token);
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        com.jurify.jurify_backend.model.PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid reset token"));

        if (resetToken.getIsUsed()) {
            throw new RuntimeException("Token already used");
        }

        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Token expired");
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        resetToken.setIsUsed(true);
        passwordResetTokenRepository.save(resetToken);
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }

    private String getFirstName(User user) {
        if (user.getRole() == com.jurify.jurify_backend.model.enums.UserRole.CITIZEN && user.getCitizen() != null) {
            return user.getCitizen().getFirstName();
        } else if (user.getRole() == com.jurify.jurify_backend.model.enums.UserRole.LAWYER
                && user.getLawyer() != null) {
            return user.getLawyer().getFirstName();
        } else if (user.getRole() == com.jurify.jurify_backend.model.enums.UserRole.NGO && user.getNgo() != null) {
            return user.getNgo().getOrganizationName();
        }
        return "";
    }

    private String getLastName(User user) {
        if (user.getRole() == com.jurify.jurify_backend.model.enums.UserRole.CITIZEN && user.getCitizen() != null) {
            return user.getCitizen().getLastName();
        } else if (user.getRole() == com.jurify.jurify_backend.model.enums.UserRole.LAWYER
                && user.getLawyer() != null) {
            return user.getLawyer().getLastName();
        }
        return "";
    }

    @Transactional
    public AuthResponse pollVerification(String pollingToken) {
        User user = userRepository.findByVerificationPollingToken(pollingToken)
                .orElse(null);

        if (user == null || !user.getIsEmailVerified()) {
            return null; // Not verified yet or invalid token
        }

        // Generate tokens
        String accessToken = jwtUtil.generateAccessToken(
                user.getId(),
                user.getEmail(),
                user.getRole().name());

        String refreshTokenValue = jwtUtil.generateRefreshToken(user.getId(), user.getEmail());

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(refreshTokenValue)
                .expiresAt(LocalDateTime.now().plusSeconds(jwtUtil.getRefreshExpiration() / 1000))
                .isRevoked(false)
                .build();

        refreshTokenRepository.save(refreshToken);

        return buildAuthResponse(user, accessToken, refreshTokenValue);
    }
}
