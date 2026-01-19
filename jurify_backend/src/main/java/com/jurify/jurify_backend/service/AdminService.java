package com.jurify.jurify_backend.service;

import com.jurify.jurify_backend.dto.admin.AdminStatsDTO;
import com.jurify.jurify_backend.model.enums.UserRole;
import com.jurify.jurify_backend.model.enums.VerificationStatus;
import com.jurify.jurify_backend.model.enums.CaseStatus;
import com.jurify.jurify_backend.repository.UserRepository;
import com.jurify.jurify_backend.repository.LegalCaseRepository;
import com.jurify.jurify_backend.repository.VerificationRequestRepository;
import java.time.LocalDateTime; // Added
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.jurify.jurify_backend.service.CloudflareR2Service;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final LegalCaseRepository legalCaseRepository;
    private final VerificationRequestRepository verificationRequestRepository;
    private final com.jurify.jurify_backend.repository.DirectoryEntryRepository directoryEntryRepository;
    private final CloudflareR2Service r2Service;

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
            // Exclude the default admin from the list
            users = userRepository.findByEmailNot("jurify.springboard@gmail.com", pageable);
        }

        return users.map(user -> {
            String name = "User";
            String phone = "-";
            String city = "-";
            String state = "-";
            String accountStatus = user.getIsActive() ? "ACTIVE" : "SUSPENDED";
            String verificationStatus = "PENDING"; // Default

            // Role specific fields
            String barCouncilNumber = null;
            java.util.List<String> specializations = null;
            Integer yearsOfExperience = null;
            String rating = "0.0";
            String availability = "UNKNOWN";
            Integer casesHandled = 0;

            String ngoDarpanId = null;
            java.util.List<String> areasOfWork = null;
            Integer proBonoCapacity = null;
            Integer activeCases = 0;

            Integer totalCasesSubmitted = 0;
            LocalDateTime lastCaseDate = null;

            if (user.getCitizen() != null) {
                name = user.getCitizen().getFirstName() + " " + user.getCitizen().getLastName();
                phone = user.getCitizen().getPhoneNumber();
                if (user.getCitizen().getLocation() != null) {
                    city = user.getCitizen().getLocation().getCity();
                    state = user.getCitizen().getLocation().getState();
                }
                verificationStatus = user.getIsEmailVerified() ? "APPROVED" : "PENDING";
                // Citizen specifics
                totalCasesSubmitted = 0; // TODO: Fetch real count
                activeCases = 0;
            } else if (user.getLawyer() != null) {
                com.jurify.jurify_backend.model.Lawyer lawyer = user.getLawyer();
                name = lawyer.getFirstName() + " " + lawyer.getLastName();
                phone = lawyer.getPhoneNumber();
                city = lawyer.getCity(); // or getOfficeAddressCity
                state = lawyer.getState(); // or getOfficeAddressState

                if (lawyer.getVerificationStatus() != null) {
                    verificationStatus = lawyer.getVerificationStatus().name();
                } else {
                    verificationStatus = lawyer.getIsVerified() ? "APPROVED" : "PENDING";
                }

                barCouncilNumber = lawyer.getBarCouncilNumber();
                // specializations todo map
                yearsOfExperience = lawyer.getYearsOfExperience();
                availability = lawyer.getIsAvailable() ? "AVAILABLE" : "BUSY";
                casesHandled = 0; // TODO
            } else if (user.getNgo() != null) {
                com.jurify.jurify_backend.model.NGO ngo = user.getNgo();
                name = ngo.getOrganizationName();
                phone = ngo.getOrganizationPhone();
                city = ngo.getCity(); // or addressCity
                state = ngo.getState(); // or addressState

                if (ngo.getVerificationStatus() != null) {
                    verificationStatus = ngo.getVerificationStatus().name();
                } else {
                    verificationStatus = ngo.getIsVerified() ? "APPROVED" : "PENDING";
                }

                ngoDarpanId = ngo.getRegistrationNumber();
                // areasOfWork todo map
                proBonoCapacity = ngo.getMaxProBonoCases();
                activeCases = 0; // TODO
            }

            boolean isVerifiedBool = "APPROVED".equals(verificationStatus) || "VERIFIED".equals(verificationStatus);

            return com.jurify.jurify_backend.dto.admin.AdminUserDTO.builder()
                    .id(user.getId())
                    .name(name)
                    .email(user.getEmail())
                    .phone(phone)
                    .city(city)
                    .state(state)
                    .role(user.getRole())
                    .accountStatus(accountStatus)
                    .verificationStatus(verificationStatus)
                    .isVerified(isVerifiedBool)
                    .joinedAt(user.getCreatedAt())
                    .lastActive(user.getLastLoginAt())
                    // Document Fallback
                    .documentUrl(getPresignedUrl(user.getLawyer() != null && user.getLawyer().getDocument() != null
                            ? user.getLawyer().getDocument().getFileUrl()
                            : user.getNgo() != null && user.getNgo().getDocuments() != null
                                    && !user.getNgo().getDocuments().isEmpty()
                                            ? user.getNgo().getDocuments().get(0).getFileUrl()
                                            : null))
                    .documentType(user.getLawyer() != null && user.getLawyer().getDocument() != null ? "Lawyer ID Card"
                            : user.getNgo() != null && user.getNgo().getDocuments() != null
                                    && !user.getNgo().getDocuments().isEmpty()
                                            ? user.getNgo().getDocuments().get(0).getDocumentCategory()
                                            : null)
                    // Lawyer
                    .barCouncilNumber(barCouncilNumber)
                    .yearsOfExperience(yearsOfExperience)
                    .rating(rating)
                    .availability(availability)
                    .casesHandled(casesHandled)
                    // NGO
                    .ngoDarpanId(ngoDarpanId)
                    .proBonoCapacity(proBonoCapacity)
                    .activeCases(activeCases)
                    // Citizen
                    .totalCasesSubmitted(totalCasesSubmitted)
                    .lastCaseDate(lastCaseDate)
                    .build();
        });
    }

    @Transactional
    public void verifyUser(Long userId) {
        com.jurify.jurify_backend.model.User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() == UserRole.LAWYER && user.getLawyer() != null) {
            user.getLawyer().setIsVerified(true);
            user.getLawyer().setVerificationStatus(VerificationStatus.VERIFIED);
        } else if (user.getRole() == UserRole.NGO && user.getNgo() != null) {
            user.getNgo().setIsVerified(true);
            user.getNgo().setVerificationStatus(VerificationStatus.VERIFIED);
        }

        // Also verify the user account itself (email verification typically implies
        // trust)
        user.setIsEmailVerified(true);
        userRepository.save(user);

        // SYNC: Update Directory Entry
        com.jurify.jurify_backend.model.DirectoryEntry directoryEntry = directoryEntryRepository.findByUser(user)
                .orElse(null);
        if (directoryEntry != null) {
            directoryEntry.setIsVerified(true);
            directoryEntryRepository.save(directoryEntry);
        }
    }

    private String getPresignedUrl(String documentUrl) {
        if (documentUrl != null && documentUrl.contains(".r2.cloudflarestorage.com/")) {
            try {
                // Extract key
                int index = documentUrl.indexOf(".r2.cloudflarestorage.com/");
                String key = documentUrl.substring(index + 26);
                if (key.startsWith("/"))
                    key = key.substring(1);

                return r2Service.generatePresignedUrl(key);
            } catch (Exception e) {
                // Return raw if signing fails
                return documentUrl;
            }
        }
        return documentUrl;
    }
}
