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
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final LegalCaseRepository legalCaseRepository;
    private final VerificationRequestRepository verificationRequestRepository;
    private final com.jurify.jurify_backend.repository.DirectoryEntryRepository directoryEntryRepository;
    private final CloudflareR2Service r2Service;
    private final AuditLogService auditLogService;
    private final com.jurify.jurify_backend.repository.AuditLogRepository auditLogRepository;

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
            users = userRepository.searchByEmail(search, pageable);
        } else {
            // Exclude the default admin from the list
            users = userRepository.findAllExceptAdmin("jurify.springboard@gmail.com", pageable);
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
            Integer yearsOfExperience = null;
            String rating = "0.0";
            String availability = "UNKNOWN";
            Integer casesHandled = 0;

            String ngoDarpanId = null;
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

        // Audit Log
        try {
            Long adminId = getCurrentAdminId();
            String ip = getClientIp();
            auditLogService.logAction("VERIFY_USER", adminId, userId, "User verified manually via Admin Panel", ip);
        } catch (Exception e) {
            System.err.println("Failed to log audit action: " + e.getMessage());
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

    /**
     * Update user status (ACTIVE, SUSPENDED, BANNED)
     */
    @Transactional
    public void updateUserStatus(Long userId, String status, String reason) {
        com.jurify.jurify_backend.model.User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        switch (status.toUpperCase()) {
            case "ACTIVE":
                user.setIsActive(true);
                break;
            case "SUSPENDED":
            case "BANNED":
                user.setIsActive(false);
                break;
            default:
                throw new IllegalArgumentException("Invalid status: " + status);
        }

        userRepository.save(user);

        // Audit Log
        try {
            Long adminId = getCurrentAdminId();
            String ip = getClientIp();
            auditLogService.logAction("UPDATE_STATUS", adminId, userId,
                    "Status changed to " + status + (reason != null ? ". Reason: " + reason : ""), ip);
        } catch (Exception e) {
            System.err.println("Failed to log audit action: " + e.getMessage());
        }
    }

    /**
     * Bulk update user statuses
     */
    @Transactional
    public void bulkUpdateStatus(java.util.List<Long> userIds, String status, String reason) {
        for (Long userId : userIds) {
            try {
                updateUserStatus(userId, status, reason);
            } catch (Exception e) {
                // Log and continue with other users
                System.err.println("Failed to update user " + userId + ": " + e.getMessage());
            }
        }
    }

    /**
     * Get detailed user information
     */
    @Transactional(readOnly = true)
    public com.jurify.jurify_backend.dto.admin.AdminUserDTO getUserDetails(Long userId) {
        com.jurify.jurify_backend.model.User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String name = "User";
        String phone = "-";
        String city = "-";
        String state = "-";
        String accountStatus = user.getIsActive() ? "ACTIVE" : "SUSPENDED";
        String verificationStatus = "PENDING";

        String barCouncilNumber = null;
        Integer yearsOfExperience = null;
        String rating = "0.0";
        String availability = "UNKNOWN";
        Integer casesHandled = 0;
        String ngoDarpanId = null;
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
        } else if (user.getLawyer() != null) {
            com.jurify.jurify_backend.model.Lawyer lawyer = user.getLawyer();
            name = lawyer.getFirstName() + " " + lawyer.getLastName();
            phone = lawyer.getPhoneNumber();
            city = lawyer.getCity();
            state = lawyer.getState();
            if (lawyer.getVerificationStatus() != null) {
                verificationStatus = lawyer.getVerificationStatus().name();
            } else {
                verificationStatus = lawyer.getIsVerified() ? "APPROVED" : "PENDING";
            }
            barCouncilNumber = lawyer.getBarCouncilNumber();
            yearsOfExperience = lawyer.getYearsOfExperience();
            availability = lawyer.getIsAvailable() ? "AVAILABLE" : "BUSY";
        } else if (user.getNgo() != null) {
            com.jurify.jurify_backend.model.NGO ngo = user.getNgo();
            name = ngo.getOrganizationName();
            phone = ngo.getOrganizationPhone();
            city = ngo.getCity();
            state = ngo.getState();
            if (ngo.getVerificationStatus() != null) {
                verificationStatus = ngo.getVerificationStatus().name();
            } else {
                verificationStatus = ngo.getIsVerified() ? "APPROVED" : "PENDING";
            }
            ngoDarpanId = ngo.getRegistrationNumber();
            proBonoCapacity = ngo.getMaxProBonoCases();
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
                .documentUrl(getPresignedUrl(user.getLawyer() != null && user.getLawyer().getDocument() != null
                        ? user.getLawyer().getDocument().getFileUrl()
                        : user.getNgo() != null && user.getNgo().getDocuments() != null
                                && !user.getNgo().getDocuments().isEmpty()
                                        ? user.getNgo().getDocuments().get(0).getFileUrl()
                                        : null))
                .barCouncilNumber(barCouncilNumber)
                .yearsOfExperience(yearsOfExperience)
                .rating(rating)
                .availability(availability)
                .casesHandled(casesHandled)
                .ngoDarpanId(ngoDarpanId)
                .proBonoCapacity(proBonoCapacity)
                .activeCases(activeCases)
                .totalCasesSubmitted(totalCasesSubmitted)
                .lastCaseDate(lastCaseDate)
                .build();
    }

    /**
     * Get user verification documents
     */
    @Transactional(readOnly = true)
    public java.util.List<java.util.Map<String, String>> getUserDocuments(Long userId) {
        com.jurify.jurify_backend.model.User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        java.util.List<java.util.Map<String, String>> documents = new java.util.ArrayList<>();

        if (user.getLawyer() != null && user.getLawyer().getDocument() != null) {
            java.util.Map<String, String> doc = new java.util.HashMap<>();
            doc.put("type", "Lawyer ID Card");
            doc.put("url", getPresignedUrl(user.getLawyer().getDocument().getFileUrl()));
            doc.put("name", user.getLawyer().getDocument().getFileName());
            documents.add(doc);
        }

        if (user.getNgo() != null && user.getNgo().getDocuments() != null) {
            for (var ngoDoc : user.getNgo().getDocuments()) {
                java.util.Map<String, String> doc = new java.util.HashMap<>();
                doc.put("type", ngoDoc.getDocumentCategory());
                doc.put("url", getPresignedUrl(ngoDoc.getFileUrl()));
                doc.put("name", ngoDoc.getFileName());
                documents.add(doc);
            }
        }

        return documents;
    }

    /**
     * Get user cases
     */
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<com.jurify.jurify_backend.dto.admin.AdminCaseDTO> getUserCases(
            Long userId, org.springframework.data.domain.Pageable pageable) {

        com.jurify.jurify_backend.model.User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        java.util.List<com.jurify.jurify_backend.model.LegalCase> cases = java.util.Collections.emptyList();

        if (user.getRole() == UserRole.CITIZEN && user.getCitizen() != null) {
            cases = legalCaseRepository.findByCitizenId(user.getCitizen().getId());
        } else if (user.getRole() == UserRole.LAWYER && user.getLawyer() != null) {
            cases = legalCaseRepository.findByLawyerId(user.getLawyer().getId());
        } else if (user.getRole() == UserRole.NGO && user.getNgo() != null) {
            cases = legalCaseRepository.findByNgoId(user.getNgo().getId());
        }

        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), cases.size());

        java.util.List<com.jurify.jurify_backend.model.LegalCase> pageContent;
        if (start > cases.size()) {
            pageContent = java.util.Collections.emptyList();
        } else {
            pageContent = cases.subList(start, end);
        }

        org.springframework.data.domain.Page<com.jurify.jurify_backend.model.LegalCase> casePage = new org.springframework.data.domain.PageImpl<>(
                pageContent, pageable, cases.size());

        return casePage.map(legalCase -> {
            String lawyerName = legalCase.getLawyer() != null
                    ? (legalCase.getLawyer().getFirstName() + " " + legalCase.getLawyer().getLastName())
                    : "Unassigned";
            String citizenName = legalCase.getCitizen() != null
                    ? (legalCase.getCitizen().getFirstName() + " " + legalCase.getCitizen().getLastName())
                    : "Unknown";

            java.util.List<String> docs = legalCase.getDocuments() != null
                    ? legalCase.getDocuments().stream().map(d -> d.getFileName())
                            .collect(java.util.stream.Collectors.toList())
                    : new java.util.ArrayList<>();

            return com.jurify.jurify_backend.dto.admin.AdminCaseDTO.builder()
                    .id("CAS-" + legalCase.getId())
                    .citizen(citizenName)
                    .lawyer(lawyerName)
                    .category(legalCase.getCategory())
                    .status(legalCase.getStatus().name())
                    .priority(legalCase.getUrgency() != null ? legalCase.getUrgency().name() : "MEDIUM")
                    .regDate(legalCase.getCreatedAt().toLocalDate().toString())
                    .regTime(legalCase.getCreatedAt().toLocalTime().toString())
                    .hearing("TBD")
                    .lawyerExp(legalCase.getLawyer() != null ? legalCase.getLawyer().getYearsOfExperience() + " Years"
                            : "N/A")
                    .lawyerCases("N/A")
                    .description(legalCase.getDescription())
                    .documents(docs)
                    .activity(java.util.Collections.singletonList("Case Created: " + legalCase.getCreatedAt()))
                    .build();
        });
    }

    /**
     * Get all audit logs for admin
     */
    public org.springframework.data.domain.Page<com.jurify.jurify_backend.dto.admin.AdminAuditLogDTO> getAuditLogs(
            org.springframework.data.domain.Pageable pageable) {
        return auditLogService.getAuditLogsDTO(pageable);
    }

    /**
     * Get filtered audit logs for admin
     */
    public org.springframework.data.domain.Page<com.jurify.jurify_backend.dto.admin.AdminAuditLogDTO> getAuditLogsFiltered(
            java.time.LocalDateTime startDate,
            java.time.LocalDateTime endDate,
            String action,
            String role,
            org.springframework.data.domain.Pageable pageable) {

        if (startDate == null) {
            startDate = java.time.LocalDateTime.of(1970, 1, 1, 0, 0);
        }
        if (endDate == null) {
            endDate = java.time.LocalDateTime.of(2100, 1, 1, 0, 0);
        }
        if (action == null) {
            action = "";
        }

        com.jurify.jurify_backend.model.enums.UserRole userRole = null;
        if (role != null && !role.isEmpty()) {
            try {
                userRole = com.jurify.jurify_backend.model.enums.UserRole.valueOf(role.toUpperCase());
            } catch (IllegalArgumentException e) {
                // Invalid role, ignore filter or handle as needed
            }
        }

        org.springframework.data.domain.Page<com.jurify.jurify_backend.model.AuditLog> logs = auditLogRepository
                .findWithFilters(startDate, endDate, action, userRole, pageable);

        return logs.map(log -> {
            String userEmail = log.getAdmin() != null ? log.getAdmin().getEmail() : "System";
            String logRole = log.getAdmin() != null ? log.getAdmin().getRole().name() : "SYSTEM";

            return com.jurify.jurify_backend.dto.admin.AdminAuditLogDTO.builder()
                    .id("LOG-" + log.getId())
                    .user(userEmail)
                    .role(logRole)
                    .action(log.getAction())
                    .module(log.getTargetEntityType())
                    .status("Success")
                    .time(log.getTimestamp().toString())
                    .ip(log.getIpAddress())
                    .device("Unknown")
                    .details(java.util.Collections.singletonMap("info", log.getDetails()))
                    .build();
        });
    }

    /**
     * Get distinct actions for filter dropdown
     */
    public java.util.List<String> getDistinctAuditActions() {
        return auditLogRepository.findDistinctActions();
    }

    /**
     * Get all cases for admin
     */
    public org.springframework.data.domain.Page<com.jurify.jurify_backend.dto.admin.AdminCaseDTO> getAllCases(
            org.springframework.data.domain.Pageable pageable) {
        return legalCaseRepository.findAll(pageable).map(legalCase -> {
            String lawyerName = legalCase.getLawyer() != null
                    ? (legalCase.getLawyer().getFirstName() + " " + legalCase.getLawyer().getLastName())
                    : "Unassigned";
            String citizenName = legalCase.getCitizen() != null
                    ? (legalCase.getCitizen().getFirstName() + " " + legalCase.getCitizen().getLastName())
                    : "Unknown";

            java.util.List<String> docs = legalCase.getDocuments() != null
                    ? legalCase.getDocuments().stream().map(d -> d.getFileName())
                            .collect(java.util.stream.Collectors.toList())
                    : new java.util.ArrayList<>();

            return com.jurify.jurify_backend.dto.admin.AdminCaseDTO.builder()
                    .id("CAS-" + legalCase.getId())
                    .citizen(citizenName)
                    .lawyer(lawyerName)
                    .category(legalCase.getCategory())
                    .status(legalCase.getStatus().name())
                    .priority(legalCase.getUrgency() != null ? legalCase.getUrgency().name() : "MEDIUM")
                    .regDate(legalCase.getCreatedAt().toLocalDate().toString())
                    .regTime(legalCase.getCreatedAt().toLocalTime().toString())
                    .hearing("TBD")
                    .lawyerExp(legalCase.getLawyer() != null ? legalCase.getLawyer().getYearsOfExperience() + " Years"
                            : "N/A")
                    .lawyerCases("N/A")
                    .description(legalCase.getDescription())
                    .documents(docs)
                    .activity(java.util.Collections.singletonList("Case Created: " + legalCase.getCreatedAt()))
                    .build();
        });
    }

    private Long getCurrentAdminId() {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            return userRepository.findByEmail(email)
                    .map(com.jurify.jurify_backend.model.User::getId)
                    .orElse(0L); // Should not happen if authorized
        } catch (Exception e) {
            return 0L;
        }
    }

    private String getClientIp() {
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
            String xf = attrs.getRequest().getHeader("X-Forwarded-For");
            if (xf != null && !xf.isEmpty()) {
                return xf.split(",")[0].trim();
            }
            return attrs.getRequest().getRemoteAddr();
        } catch (Exception e) {
            return "UNKNOWN";
        }
    }

    @Transactional(readOnly = true)
    public com.jurify.jurify_backend.dto.admin.AdminInsightsDTO getInsights() {
        java.util.List<com.jurify.jurify_backend.model.LegalCase> cases = legalCaseRepository.findAll();

        int totalCases = cases.size();
        int resolvedCases = 0;
        long totalDuration = 0;
        int casesWithDuration = 0;

        for (com.jurify.jurify_backend.model.LegalCase c : cases) {
            if (c.getStatus() == CaseStatus.RESOLVED) {
                resolvedCases++;
                if (c.getCreatedAt() != null && c.getUpdatedAt() != null) {
                    long duration = java.time.temporal.ChronoUnit.DAYS.between(c.getCreatedAt(), c.getUpdatedAt());
                    totalDuration += duration;
                    casesWithDuration++;
                }
            }
        }

        int avgDays = casesWithDuration > 0 ? (int) (totalDuration / casesWithDuration) : 0;
        int successRate = totalCases > 0 ? (resolvedCases * 100) / totalCases : 0;

        // Resolution Trend (Last 6 months)
        java.util.Map<java.time.YearMonth, Integer> trendMap = new java.util.LinkedHashMap<>();
        java.time.YearMonth currentMonth = java.time.YearMonth.now();
        for (int i = 5; i >= 0; i--) {
            trendMap.put(currentMonth.minusMonths(i), 0);
        }

        for (com.jurify.jurify_backend.model.LegalCase c : cases) {
            if (c.getStatus() == CaseStatus.RESOLVED && c.getUpdatedAt() != null) {
                java.time.YearMonth ym = java.time.YearMonth.from(c.getUpdatedAt());
                if (trendMap.containsKey(ym)) {
                    trendMap.put(ym, trendMap.get(ym) + 1);
                }
            }
        }

        java.util.List<com.jurify.jurify_backend.dto.admin.AdminInsightsDTO.ChartDataDTO> resolutionTrend = new java.util.ArrayList<>();
        java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("MMM");
        trendMap.forEach((ym, count) -> {
            resolutionTrend.add(com.jurify.jurify_backend.dto.admin.AdminInsightsDTO.ChartDataDTO.builder()
                    .name(ym.format(formatter))
                    .value(count)
                    .build());
        });

        // Case Distribution
        java.util.Map<String, Integer> distMap = new java.util.HashMap<>();
        for (com.jurify.jurify_backend.model.LegalCase c : cases) {
            String cat = c.getCategory() != null ? c.getCategory() : "Uncategorized";
            distMap.put(cat, distMap.getOrDefault(cat, 0) + 1);
        }

        java.util.List<com.jurify.jurify_backend.dto.admin.AdminInsightsDTO.ChartDataDTO> caseDistribution = new java.util.ArrayList<>();
        distMap.forEach((cat, count) -> {
            caseDistribution.add(com.jurify.jurify_backend.dto.admin.AdminInsightsDTO.ChartDataDTO.builder()
                    .name(cat)
                    .value(count)
                    .build());
        });

        // Geo Distribution (Mock coordinates for major cities)
        java.util.Map<String, Integer> geoMap = new java.util.HashMap<>();
        for (com.jurify.jurify_backend.model.LegalCase c : cases) {
            String city = "Unspecified";
            if (c.getCitizen() != null && c.getCitizen().getLocation() != null
                    && c.getCitizen().getLocation().getCity() != null) {
                city = c.getCitizen().getLocation().getCity();
            }
            geoMap.put(city, geoMap.getOrDefault(city, 0) + 1);
        }

        java.util.List<com.jurify.jurify_backend.dto.admin.AdminInsightsDTO.GeoDataDTO> geoDistribution = new java.util.ArrayList<>();
        geoMap.forEach((city, count) -> {
            double[] coords = getCityCoordinates(city);
            geoDistribution.add(com.jurify.jurify_backend.dto.admin.AdminInsightsDTO.GeoDataDTO.builder()
                    .name(city)
                    .count(count)
                    .lat(coords[0])
                    .lng(coords[1])
                    .build());
        });

        return com.jurify.jurify_backend.dto.admin.AdminInsightsDTO.builder()
                .impactStats(com.jurify.jurify_backend.dto.admin.AdminInsightsDTO.ImpactStatsDTO.builder()
                        .casesHandled(totalCases)
                        .resolvedCases(resolvedCases)
                        .avgResolutionTime(avgDays)
                        .successRate(successRate)
                        .build())
                .resolutionTrend(resolutionTrend)
                .caseDistribution(caseDistribution)
                .geoDistribution(geoDistribution)
                .build();
    }

    private double[] getCityCoordinates(String city) {
        if (city == null)
            return new double[] { 20.5937, 78.9629 };

        // Comprehensive list of major Indian cities
        switch (city.toLowerCase().trim()) {
            case "mumbai":
                return new double[] { 19.0760, 72.8777 };
            case "delhi":
            case "new delhi":
                return new double[] { 28.6139, 77.2090 };
            case "bangalore":
            case "bengaluru":
                return new double[] { 12.9716, 77.5946 };
            case "chennai":
                return new double[] { 13.0827, 80.2707 };
            case "kolkata":
                return new double[] { 22.5726, 88.3639 };
            case "hyderabad":
                return new double[] { 17.3850, 78.4867 };
            case "pune":
                return new double[] { 18.5204, 73.8567 };
            case "ahmedabad":
                return new double[] { 23.0225, 72.5714 };
            case "jaipur":
                return new double[] { 26.9124, 75.7873 };
            case "surat":
                return new double[] { 21.1702, 72.8311 };
            case "lucknow":
                return new double[] { 26.8467, 80.9462 };
            case "kanpur":
                return new double[] { 26.4499, 80.3319 };
            case "nagpur":
                return new double[] { 21.1458, 79.0882 };
            case "indore":
                return new double[] { 22.7196, 75.8577 };
            case "thane":
                return new double[] { 19.2183, 72.9781 };
            case "bhopal":
                return new double[] { 23.2599, 77.4126 };
            case "visakhapatnam":
                return new double[] { 17.6868, 83.2185 };
            case "patna":
                return new double[] { 25.5941, 85.1376 };
            case "vadodara":
                return new double[] { 22.3072, 73.1812 };
            case "ghaziabad":
                return new double[] { 28.6692, 77.4538 };
            case "ludhiana":
                return new double[] { 30.9010, 75.8573 };
            case "agra":
                return new double[] { 27.1767, 78.0081 };
            case "nashik":
                return new double[] { 19.9975, 73.7898 };
            case "farridabad":
                return new double[] { 28.4089, 77.3178 };
            case "meerut":
                return new double[] { 28.9845, 77.7064 };
            case "rajkot":
                return new double[] { 22.3039, 70.8022 };
            case "kalyan-dombivli":
                return new double[] { 19.2403, 73.1305 };
            case "vasai-virar":
                return new double[] { 19.3919, 72.8397 };
            case "varanasi":
                return new double[] { 25.3176, 82.9739 };
            case "srinagar":
                return new double[] { 34.0837, 74.7973 };
            case "aurangabad":
                return new double[] { 19.8762, 75.3433 };
            case "dhanbad":
                return new double[] { 23.7957, 86.4304 };
            case "amritsar":
                return new double[] { 31.6340, 74.8723 };
            case "navi mumbai":
                return new double[] { 19.0330, 73.0297 };
            case "allahabad":
            case "prayagraj":
                return new double[] { 25.4358, 81.8463 };
            case "howrah":
                return new double[] { 22.5958, 88.2636 };
            case "gwalior":
                return new double[] { 26.2183, 78.1828 };
            case "jabalpur":
                return new double[] { 23.1815, 79.9864 };
            case "coimbatore":
                return new double[] { 11.0168, 76.9558 };
            case "vijayawada":
                return new double[] { 16.5062, 80.6480 };
            case "jodhpur":
                return new double[] { 26.2389, 73.0243 };
            case "madurai":
                return new double[] { 9.9252, 78.1198 };
            case "raipur":
                return new double[] { 21.2514, 81.6296 };
            case "kota":
                return new double[] { 25.0968, 75.8356 };
            case "chandigarh":
                return new double[] { 30.7333, 76.7794 };
            case "guwahati":
                return new double[] { 26.1445, 91.7362 };
            case "solapur":
                return new double[] { 17.6599, 75.9064 };
            case "hubli":
            case "hubballi":
                return new double[] { 15.3647, 75.1240 };
            case "mysore":
            case "mysuru":
                return new double[] { 12.2958, 76.6394 };
            case "tiruchirappalli":
            case "trichy":
                return new double[] { 10.7905, 78.7047 };
            case "bareilly":
                return new double[] { 28.3670, 79.4304 };
            case "aligarh":
                return new double[] { 27.8974, 78.0880 };
            case "tiruppur":
                return new double[] { 11.1085, 77.3411 };
            case "gurgaon":
            case "gurugram":
                return new double[] { 28.4595, 77.0266 };
            case "moradabad":
                return new double[] { 28.8386, 78.7733 };
            case "jalandhar":
                return new double[] { 31.3260, 75.5762 };
            case "bhubaneswar":
                return new double[] { 20.2961, 85.8245 };
            case "salem":
                return new double[] { 11.6643, 78.1460 };
            case "warangal":
                return new double[] { 17.9689, 79.5941 };
            case "thiruvananthapuram":
            case "trivandrum":
                return new double[] { 8.5241, 76.9366 };
            case "kochi":
            case "cochin":
                return new double[] { 9.9312, 76.2673 };
            case "kozhikode":
            case "calicut":
                return new double[] { 11.2588, 75.7804 };
            case "dehradun":
                return new double[] { 30.3165, 78.0322 };
            case "noida":
                return new double[] { 28.5355, 77.3910 };
            case "jammu":
                return new double[] { 32.7266, 74.8570 };
            case "shimla":
                return new double[] { 31.1048, 77.1734 };
            case "panaji":
            case "goa":
                return new double[] { 15.4909, 73.8278 };
            case "ranchi":
                return new double[] { 23.3441, 85.3096 };
            case "pondy":
            case "puducherry":
                return new double[] { 11.9416, 79.8083 };
            case "tirunelveli":
                return new double[] { 8.7139, 77.7567 };
            case "vellore":
                return new double[] { 12.9165, 79.1325 };
            case "erode":
                return new double[] { 11.3410, 77.7172 };
            case "mangalore":
            case "mangaluru":
                return new double[] { 12.9141, 74.8560 };
            default:
                // Default to Center of India for unknown cities
                return new double[] { 20.5937, 78.9629 };
        }
    }
}
