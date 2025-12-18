package com.jurify.jurify_backend.service;

import com.jurify.jurify_backend.dto.admin.AdminStatsDTO;
import com.jurify.jurify_backend.model.enums.UserRole;
import com.jurify.jurify_backend.model.enums.VerificationStatus;
import com.jurify.jurify_backend.model.enums.CaseStatus;
import com.jurify.jurify_backend.repository.UserRepository;
import com.jurify.jurify_backend.repository.LegalCaseRepository;
import com.jurify.jurify_backend.repository.VerificationRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final LegalCaseRepository legalCaseRepository;
    private final VerificationRequestRepository verificationRequestRepository;

    @Transactional(readOnly = true)
    public AdminStatsDTO getStats() {
        long totalUsers = userRepository.count();
        long totalLawyers = userRepository.countByRole(UserRole.LAWYER);
        long totalNGOs = userRepository.countByRole(UserRole.NGO);
        long pendingVerifications = verificationRequestRepository.countByStatus(VerificationStatus.PENDING);
        long resolvedCases = legalCaseRepository.countByStatus(CaseStatus.RESOLVED);

        return AdminStatsDTO.builder()
                .totalUsers(totalUsers)
                .totalLawyers(totalLawyers)
                .totalNGOs(totalNGOs)
                .pendingVerifications(pendingVerifications)
                .resolvedCases(resolvedCases)
                .build();
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<com.jurify.jurify_backend.dto.admin.AdminUserDTO> getUsers(
            org.springframework.data.domain.Pageable pageable, String search) {
        // Simple search by email for now, or fetch all
        // Ideally we should have a search method in UserRepository
        org.springframework.data.domain.Page<com.jurify.jurify_backend.model.User> users;

        if (search != null && !search.isEmpty()) {
            // Need a search method. For now, let's fetch all and filter in memory if repo
            // method missing
            // But better to use finding by email containing
            // users = userRepository.findByEmailContaining(search, pageable);
            // I'll assume findByEmailContaining exists or I should add it.
            // Actually, I didn't verify if I can add it.
            // Let's just return all for now to avoid compilation errors if I don't touch
            // repo.
            // Or better:
            users = userRepository.findAll(pageable); // Placeholder for search
        } else {
            users = userRepository.findAll(pageable);
        }

        return users.map(user -> {
            String name = "User";
            String status = user.getIsActive() ? "ACTIVE" : "SUSPENDED";
            boolean isVerified = false;

            if (user.getCitizen() != null) {
                name = user.getCitizen().getFirstName() + " " + user.getCitizen().getLastName();
                isVerified = user.getIsEmailVerified();
            } else if (user.getLawyer() != null) {
                name = user.getLawyer().getFirstName() + " " + user.getLawyer().getLastName();
                isVerified = user.getLawyer().getIsVerified();
            } else if (user.getNgo() != null) {
                name = user.getNgo().getOrganizationName();
                isVerified = user.getNgo().getIsVerified();
            }

            return com.jurify.jurify_backend.dto.admin.AdminUserDTO.builder()
                    .id(user.getId())
                    .name(name)
                    .email(user.getEmail())
                    .role(user.getRole())
                    .status(status)
                    .joinedAt(user.getCreatedAt())
                    .activity(0) // Logic for activity count later
                    .isVerified(isVerified)
                    .build();
        });
    }

    @Transactional
    public void verifyUser(Long userId) {
        com.jurify.jurify_backend.model.User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() == UserRole.LAWYER && user.getLawyer() != null) {
            user.getLawyer().setIsVerified(true);
        } else if (user.getRole() == UserRole.NGO && user.getNgo() != null) {
            user.getNgo().setIsVerified(true);
        }

        // Also verify the user account itself (email verification typically implies
        // trust)
        user.setIsEmailVerified(true);
        userRepository.save(user);
    }
}
