package com.jurify.jurify_backend.service;

import com.jurify.jurify_backend.dto.case_management.CaseStatsDTO;
import com.jurify.jurify_backend.dto.case_management.LegalCaseDTO;
import com.jurify.jurify_backend.model.LegalCase;
import com.jurify.jurify_backend.model.User;
import com.jurify.jurify_backend.model.enums.CaseStatus;
import com.jurify.jurify_backend.model.enums.UserRole;
import com.jurify.jurify_backend.repository.ChatMessageRepository;
import com.jurify.jurify_backend.repository.LegalCaseRepository;
import com.jurify.jurify_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LegalCaseService {

        private final LegalCaseRepository legalCaseRepository;
        private final UserRepository userRepository;
        private final CloudflareR2Service r2Service;
        private final ChatMessageRepository chatMessageRepository;
        private final com.jurify.jurify_backend.repository.CaseDocumentRepository caseDocumentRepository;
        private final com.jurify.jurify_backend.repository.CaseMatchRepository caseMatchRepository;
        private final PresenceService presenceService;
        private final MatchingEngineService matchingEngineService;
        private final com.jurify.jurify_backend.repository.AppointmentRepository appointmentRepository;
        private final AuditLogService auditLogService;
        private final com.jurify.jurify_backend.repository.ReviewRepository reviewRepository;
        private final com.jurify.jurify_backend.repository.LawyerRepository lawyerRepository;
        private final com.jurify.jurify_backend.repository.NGORepository ngoRepository;
        private final com.jurify.jurify_backend.repository.DirectoryEntryRepository directoryEntryRepository;
        private final com.jurify.jurify_backend.repository.ConsultationRepository consultationRepository;

        @org.springframework.beans.factory.annotation.Value("${cloudflare.r2.public-url}")
        private String r2PublicUrl;

        @Transactional(readOnly = true)
        public List<LegalCaseDTO> getCasesForUser(String email) {
                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                if (user.getRole() == UserRole.CITIZEN && user.getCitizen() != null) {
                        return legalCaseRepository.findByCitizenId(user.getCitizen().getId()).stream()
                                        .map(lc -> mapToDTO(lc, email))
                                        .collect(Collectors.toMap(LegalCaseDTO::getId, dto -> dto,
                                                        (existing, replacement) -> existing))
                                        .values().stream().collect(Collectors.toList());
                } else if (user.getRole() == UserRole.LAWYER && user.getLawyer() != null) {
                        return legalCaseRepository.findByLawyerId(user.getLawyer().getId()).stream()
                                        .map(lc -> mapToDTO(lc, email))
                                        .collect(Collectors.toMap(LegalCaseDTO::getId, dto -> dto,
                                                        (existing, replacement) -> existing))
                                        .values().stream().collect(Collectors.toList());

                } else if (user.getRole() == UserRole.NGO && user.getNgo() != null) {
                        return legalCaseRepository.findByNgoId(user.getNgo().getId()).stream()
                                        .map(lc -> mapToDTO(lc, email))
                                        .collect(Collectors.toMap(LegalCaseDTO::getId, dto -> dto,
                                                        (existing, replacement) -> existing))
                                        .values().stream().collect(Collectors.toList());
                }
                return List.of();
        }

        @Transactional(readOnly = true)
        public CaseStatsDTO getCaseStatsForUser(String email) {
                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                if (user.getRole() == UserRole.CITIZEN && user.getCitizen() != null) {
                        Long citizenId = user.getCitizen().getId();
                        return CaseStatsDTO.builder()
                                        .totalCases(legalCaseRepository.countByCitizenId(citizenId))
                                        .activeCases(legalCaseRepository.countByCitizenIdAndStatus(citizenId,
                                                        CaseStatus.ACTIVE))
                                        .pendingCases(legalCaseRepository.countByCitizenIdAndStatus(citizenId,
                                                        CaseStatus.PENDING))
                                        .resolvedCases(legalCaseRepository.countByCitizenIdAndStatus(citizenId,
                                                        CaseStatus.RESOLVED))
                                        .build();
                } else if (user.getRole() == UserRole.LAWYER && user.getLawyer() != null) {
                        Long lawyerId = user.getLawyer().getId();
                        return CaseStatsDTO.builder()
                                        .totalCases(legalCaseRepository.countByLawyerId(lawyerId))
                                        .activeCases(legalCaseRepository.countByLawyerIdAndStatus(lawyerId,
                                                        CaseStatus.ACTIVE))
                                        .pendingCases(legalCaseRepository.countByLawyerIdAndStatus(lawyerId,
                                                        CaseStatus.PENDING))
                                        .resolvedCases(legalCaseRepository.countByLawyerIdAndStatus(lawyerId,
                                                        CaseStatus.RESOLVED))
                                        .build();
                } else if (user.getRole() == UserRole.NGO && user.getNgo() != null) {
                        Long ngoId = user.getNgo().getId();
                        return CaseStatsDTO.builder()
                                        .totalCases(legalCaseRepository.countByNgoId(ngoId))
                                        .activeCases(legalCaseRepository.countByNgoIdAndStatus(ngoId,
                                                        CaseStatus.ACTIVE))
                                        .pendingCases(legalCaseRepository.countByNgoIdAndStatus(ngoId,
                                                        CaseStatus.PENDING))
                                        .resolvedCases(legalCaseRepository.countByNgoIdAndStatus(ngoId,
                                                        CaseStatus.RESOLVED))
                                        .build();
                }
                return CaseStatsDTO.builder().totalCases(0L).activeCases(0L).pendingCases(0L).resolvedCases(0L).build();
        }

        @Transactional
        public LegalCase createCase(String email,
                        com.jurify.jurify_backend.dto.case_management.CreateCaseRequest request,
                        List<org.springframework.web.multipart.MultipartFile> documents) {
                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                if (user.getRole() != UserRole.CITIZEN || user.getCitizen() == null) {
                        throw new RuntimeException("Only citizens can create cases");
                }

                com.jurify.jurify_backend.model.Location caseLocation = new com.jurify.jurify_backend.model.Location();
                caseLocation.setCity(request.getCity());
                caseLocation.setState(request.getState());
                caseLocation.setPincode(request.getPincode());
                caseLocation.setCountry(request.getCountry());
                caseLocation.setLatitude(request.getLatitude());
                caseLocation.setLongitude(request.getLongitude());

                LegalCase legalCase = LegalCase.builder()
                                .title(request.getTitle())
                                .description(request.getDescription())
                                .citizen(user.getCitizen())
                                .status(CaseStatus.PENDING)
                                .category(request.getCategory())
                                .urgency(request.getUrgency() != null
                                                ? com.jurify.jurify_backend.model.enums.CaseUrgency
                                                                .valueOf(request.getUrgency())
                                                : null)
                                .preferredLanguage(request.getPreferredLanguage() != null
                                                ? com.jurify.jurify_backend.model.enums.Language
                                                                .valueOf(request.getPreferredLanguage())
                                                : null)
                                .location(caseLocation)
                                .addressLine1(request.getOfficeAddressLine1())
                                .categorySpecificData(request.getCategorySpecificData())
                                .build();

                legalCase = legalCaseRepository.save(legalCase);

                // Generate Case Number: CASE-YYYY-XXXX
                int year = java.time.Year.now().getValue();
                String caseNumber = String.format("CASE-%d-%04d", year, legalCase.getId());
                legalCase.setCaseNumber(caseNumber);
                legalCase = legalCaseRepository.save(legalCase);

                if (documents != null && !documents.isEmpty()) {
                        List<com.jurify.jurify_backend.model.CaseDocument> caseDocuments = new java.util.ArrayList<>();
                        for (org.springframework.web.multipart.MultipartFile file : documents) {
                                if (file.isEmpty())
                                        continue;
                                try {
                                        // Upload to R2
                                        String s3Key = r2Service.uploadFile(file,
                                                        "cases/" + legalCase.getId() + "/documents");
                                        String fileUrl = r2PublicUrl + "/" + s3Key;

                                        com.jurify.jurify_backend.model.CaseDocument doc = com.jurify.jurify_backend.model.CaseDocument
                                                        .builder()
                                                        .legalCase(legalCase)
                                                        .fileName(file.getOriginalFilename())
                                                        .fileType(file.getContentType())
                                                        .s3Key(s3Key)
                                                        .fileUrl(fileUrl)
                                                        .build();
                                        caseDocuments.add(doc);
                                } catch (java.io.IOException e) {
                                        throw new RuntimeException("Failed to upload document", e);
                                }
                        }
                        if (!caseDocuments.isEmpty()) {
                                caseDocumentRepository.saveAll(caseDocuments);
                        }
                }
                // Trigger Matching Engine Automatically
                matchingEngineService.generateMatches(legalCase.getId());

                // Audit Log: Case Submitted
                auditLogService.logSystemAction("CASE_SUBMITTED", user.getId(), "CASE", legalCase.getId(),
                                "Case submitted: " + legalCase.getTitle());

                return legalCase;
        }

        @Transactional(readOnly = true)
        public LegalCaseDTO getCaseById(Long id, String email) {
                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                LegalCase legalCase = legalCaseRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Case not found"));

                // Access Control
                boolean isOwner = legalCase.getCitizen() != null && user.getCitizen() != null
                                && legalCase.getCitizen().getId().equals(user.getCitizen().getId());
                boolean isAssignedLawyer = legalCase.getLawyer() != null && user.getLawyer() != null
                                && legalCase.getLawyer().getId().equals(user.getLawyer().getId());

                if (!isOwner && !isAssignedLawyer) {
                        // Check if the user is a matched provider
                        Long providerId = null;
                        String providerType = null;
                        if (user.getRole() == UserRole.LAWYER) {
                                providerId = user.getLawyer().getId();
                                providerType = "LAWYER";
                        } else if (user.getRole() == UserRole.NGO) {
                                providerId = user.getNgo().getId();
                                providerType = "NGO";
                        }

                        if (providerId != null) {
                                boolean isMatched = caseMatchRepository
                                                .findByLegalCaseAndProviderIdAndProviderType(legalCase, providerId,
                                                                providerType)
                                                .isPresent();

                                boolean hasAppointment = appointmentRepository
                                                .existsByCaseIdAndProviderId(legalCase.getId(), providerId);

                                if (!isMatched && !hasAppointment) {
                                        throw new RuntimeException("Access denied");
                                }
                        } else {
                                throw new RuntimeException("Access denied");
                        }
                }

                return mapToDTO(legalCase, email);
        }

        private LegalCaseDTO mapToDTO(LegalCase legalCase, String currentUserEmail) {
                long unreadCount = 0;
                boolean hasStartedChat = false;

                if (chatMessageRepository != null) {
                        unreadCount = chatMessageRepository.countByCaseIdAndReceiverIdAndIsReadFalse(legalCase.getId(),
                                        currentUserEmail);
                        hasStartedChat = chatMessageRepository.existsByCaseId(legalCase.getId());
                }

                java.util.List<com.jurify.jurify_backend.dto.case_management.CaseDocumentDTO> documentDTOs = new java.util.ArrayList<>();
                if (legalCase.getDocuments() != null) {
                        documentDTOs = legalCase.getDocuments().stream()
                                        .map(doc -> {
                                                String presignedUrl = doc.getFileUrl();
                                                try {
                                                        if (doc.getS3Key() != null) {
                                                                presignedUrl = r2Service
                                                                                .generatePresignedUrl(doc.getS3Key());
                                                        }
                                                } catch (Exception e) {
                                                        // Fallback to stored URL if generation fails
                                                        System.err.println("Failed to generate presigned URL for doc "
                                                                        + doc.getId() + ": " + e.getMessage());
                                                }

                                                return com.jurify.jurify_backend.dto.case_management.CaseDocumentDTO
                                                                .builder()
                                                                .id(doc.getId())
                                                                .fileName(doc.getFileName())
                                                                .fileType(doc.getFileType())
                                                                .fileUrl(presignedUrl)
                                                                .uploadedAt(doc.getCreatedAt())
                                                                .build();
                                        })
                                        .collect(Collectors.toList());
                }

                String onlineStatus = "offline";
                if (presenceService != null) {
                        String otherEmail = null;
                        if (legalCase.getCitizen().getUser().getEmail().equals(currentUserEmail)) {
                                if (legalCase.getLawyer() != null) {
                                        otherEmail = legalCase.getLawyer().getUser().getEmail();
                                } else if (legalCase.getNgo() != null) {
                                        otherEmail = legalCase.getNgo().getUser().getEmail();
                                }
                        } else {
                                otherEmail = legalCase.getCitizen().getUser().getEmail();
                        }

                        if (otherEmail != null && presenceService.isOnline(otherEmail)) {
                                onlineStatus = "online";
                        }
                }

                return LegalCaseDTO.builder()
                                .id(legalCase.getId())
                                .caseNumber(legalCase.getCaseNumber())
                                .title(legalCase.getTitle())
                                .description(legalCase.getDescription())
                                .status(legalCase.getStatus())
                                .lawyerName(legalCase.getLawyer() != null
                                                ? legalCase.getLawyer().getFirstName() + " "
                                                                + legalCase.getLawyer().getLastName()
                                                : "Unassigned")
                                .lawyerId(legalCase.getLawyer() != null
                                                ? legalCase.getLawyer().getUser().getId()
                                                : null)
                                .lawyerEmail(legalCase.getLawyer() != null
                                                ? legalCase.getLawyer().getUser().getEmail()
                                                : null)
                                .lawyerPhone(legalCase.getLawyer() != null
                                                ? legalCase.getLawyer().getPhoneNumber()
                                                : null)
                                .ngoName(legalCase.getNgo() != null
                                                ? legalCase.getNgo().getOrganizationName()
                                                : null)
                                .ngoEmail(legalCase.getNgo() != null
                                                ? legalCase.getNgo().getUser().getEmail()
                                                : null)
                                .ngoPhone(legalCase.getNgo() != null
                                                ? legalCase.getNgo().getOrganizationPhone()
                                                : null)
                                .category(legalCase.getCategory())
                                .citizenId(legalCase.getCitizen().getId())
                                .citizenUserId(legalCase.getCitizen().getUser().getId())
                                .citizenName(legalCase.getCitizen().getFirstName() + " "
                                                + legalCase.getCitizen().getLastName())
                                .citizenEmail(legalCase.getCitizen().getUser().getEmail())
                                .citizenPhone(legalCase.getCitizen().getPhoneNumber())
                                .urgency(legalCase.getUrgency() != null ? legalCase.getUrgency().name() : null)
                                .preferredLanguage(
                                                legalCase.getPreferredLanguage() != null
                                                                ? legalCase.getPreferredLanguage().name()
                                                                : null)
                                .locationCity(legalCase.getLocation() != null ? legalCase.getLocation().getCity()
                                                : null)
                                .documents(documentDTOs)
                                .unreadCount(unreadCount)
                                .hasStartedChat(hasStartedChat)
                                .onlineStatus(onlineStatus)
                                .isLawyerAvailable(
                                                legalCase.getLawyer() != null ? legalCase.getLawyer().getIsAvailable()
                                                                : true)
                                .createdAt(legalCase.getCreatedAt())
                                .updatedAt(legalCase.getUpdatedAt())
                                .build();
        }

        // ============== RESOLUTION METHODS ==============

        /**
         * Lawyer/NGO submits a resolution for a case
         */
        @Transactional
        public com.jurify.jurify_backend.dto.case_management.ResolutionResponseDTO submitResolution(
                        Long caseId, String providerEmail,
                        org.springframework.web.multipart.MultipartFile document, String notes) {

                System.out.println("DEBUG: Service submitResolution for case " + caseId);

                User provider = userRepository.findByEmail(providerEmail)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                LegalCase legalCase = legalCaseRepository.findById(caseId)
                                .orElseThrow(() -> new RuntimeException("Case not found"));

                // Verify the provider is assigned to this case
                boolean isAssigned = false;
                if (provider.getRole() == UserRole.LAWYER && provider.getLawyer() != null) {
                        isAssigned = legalCase.getLawyer() != null
                                        && legalCase.getLawyer().getId().equals(provider.getLawyer().getId());
                } else if (provider.getRole() == UserRole.NGO && provider.getNgo() != null) {
                        isAssigned = legalCase.getNgo() != null
                                        && legalCase.getNgo().getId().equals(provider.getNgo().getId());
                }

                if (!isAssigned) {
                        throw new RuntimeException("You are not assigned to this case");
                }

                // Verify case is in ACTIVE status
                if (legalCase.getStatus() != CaseStatus.ACTIVE) {
                        throw new RuntimeException("Case must be ACTIVE to submit resolution");
                }

                // Upload document to R2
                String s3Key = null;
                String fileUrl = null;
                if (document != null && !document.isEmpty()) {
                        try {
                                System.out.println("DEBUG: Uploading file to R2...");
                                s3Key = r2Service.uploadFile(document, "cases/" + caseId + "/resolution");
                                fileUrl = r2PublicUrl + "/" + s3Key;
                                System.out.println("DEBUG: Upload success. URL: " + fileUrl);
                        } catch (java.io.IOException e) {
                                e.printStackTrace();
                                throw new RuntimeException("Failed to upload resolution document", e);
                        }
                } else {
                        System.out.println("DEBUG: Document is empty or null in service");
                }

                // Update case
                legalCase.setResolutionDocumentUrl(fileUrl);
                legalCase.setResolutionDocumentS3Key(s3Key);
                legalCase.setResolutionNotes(notes);
                legalCase.setResolutionSubmittedAt(java.time.LocalDateTime.now());
                legalCase.setResolutionSubmittedBy(provider.getId());
                legalCase.setStatus(CaseStatus.PENDING_RESOLUTION);

                legalCaseRepository.save(legalCase);

                // Audit log
                auditLogService.logSystemAction("RESOLUTION_SUBMITTED", provider.getId(), "CASE", caseId,
                                "Resolution submitted for case: " + legalCase.getTitle());

                // Get provider name
                String providerName = getProviderName(provider);

                return com.jurify.jurify_backend.dto.case_management.ResolutionResponseDTO.builder()
                                .caseId(caseId)
                                .caseTitle(legalCase.getTitle())
                                .status(legalCase.getStatus().name())
                                .resolutionDocumentUrl(fileUrl)
                                .resolutionNotes(notes)
                                .resolutionSubmittedAt(legalCase.getResolutionSubmittedAt())
                                .submittedByName(providerName)
                                .message("Resolution submitted successfully. Awaiting citizen acknowledgment.")
                                .build();
        }

        /**
         * Citizen acknowledges/accepts the resolution
         */
        @Transactional
        public com.jurify.jurify_backend.dto.case_management.ResolutionResponseDTO acknowledgeResolution(
                        Long caseId, String citizenEmail,
                        com.jurify.jurify_backend.dto.case_resolution.ResolutionAcknowledgmentDTO acknowledgmentDTO) {

                User citizen = userRepository.findByEmail(citizenEmail)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                if (citizen.getRole() != UserRole.CITIZEN || citizen.getCitizen() == null) {
                        throw new RuntimeException("Only citizens can acknowledge resolutions");
                }

                LegalCase legalCase = legalCaseRepository.findById(caseId)
                                .orElseThrow(() -> new RuntimeException("Case not found"));

                // Verify citizen owns this case
                if (!legalCase.getCitizen().getId().equals(citizen.getCitizen().getId())) {
                        throw new RuntimeException("You are not the owner of this case");
                }

                // Verify case is in PENDING_RESOLUTION status
                if (legalCase.getStatus() != CaseStatus.PENDING_RESOLUTION) {
                        throw new RuntimeException("Case is not pending resolution");
                }

                // Update case to RESOLVED
                legalCase.setStatus(CaseStatus.RESOLVED);
                legalCase.setResolutionAcknowledgedAt(java.time.LocalDateTime.now());

                legalCaseRepository.save(legalCase);

                // PROCESS REVIEW IF PROVIDED
                if (acknowledgmentDTO != null && acknowledgmentDTO.getRating() != null) {
                        try {
                                com.jurify.jurify_backend.model.Review review = com.jurify.jurify_backend.model.Review
                                                .builder()
                                                .legalCase(legalCase)
                                                .reviewer(citizen.getCitizen())
                                                .rating(acknowledgmentDTO.getRating())
                                                .comment(acknowledgmentDTO.getFeedback())
                                                .build();

                                if (legalCase.getLawyer() != null) {
                                        review.setLawyer(legalCase.getLawyer());
                                        reviewRepository.save(review);
                                        reviewRepository.flush(); // Ensure review is committed for stats calculation
                                        updateLawyerStats(legalCase.getLawyer());
                                } else if (legalCase.getNgo() != null) {
                                        review.setNgo(legalCase.getNgo());
                                        reviewRepository.save(review);
                                        reviewRepository.flush(); // Ensure review is committed for stats calculation
                                        updateNgoStats(legalCase.getNgo());
                                }
                        } catch (Exception e) {
                                System.err.println("Failed to save review: " + e.getMessage());
                        }
                }

                // Audit log
                auditLogService.logSystemAction("RESOLUTION_ACKNOWLEDGED", citizen.getId(), "CASE", caseId,
                                "Resolution acknowledged for case: " + legalCase.getTitle());
                auditLogService.logSystemAction("CASE_RESOLVED", citizen.getId(), "CASE", caseId,
                                "Case resolved: " + legalCase.getTitle());

                // Sync Directory Stats
                if (legalCase.getLawyer() != null) {
                        syncDirectoryStats(legalCase.getLawyer().getUser());
                } else if (legalCase.getNgo() != null) {
                        syncDirectoryStats(legalCase.getNgo().getUser());
                }

                return com.jurify.jurify_backend.dto.case_management.ResolutionResponseDTO.builder()
                                .caseId(caseId)
                                .caseTitle(legalCase.getTitle())
                                .status(legalCase.getStatus().name())
                                .resolutionDocumentUrl(legalCase.getResolutionDocumentUrl())
                                .resolutionNotes(legalCase.getResolutionNotes())
                                .resolutionSubmittedAt(legalCase.getResolutionSubmittedAt())
                                .resolutionAcknowledgedAt(legalCase.getResolutionAcknowledgedAt())
                                .message("Case has been resolved successfully!")
                                .build();
        }

        public com.jurify.jurify_backend.dto.case_management.ResolutionResponseDTO getResolutionDetails(
                        Long caseId, String userEmail) {

                LegalCase legalCase = legalCaseRepository.findById(caseId)
                                .orElseThrow(() -> new RuntimeException("Case not found"));

                String submitterName = null;
                if (legalCase.getResolutionSubmittedBy() != null) {
                        User submitter = userRepository.findById(legalCase.getResolutionSubmittedBy()).orElse(null);
                        if (submitter != null) {
                                submitterName = getProviderName(submitter);
                        }
                }

                String presignedUrl = legalCase.getResolutionDocumentUrl();
                if (legalCase.getResolutionDocumentS3Key() != null) {
                        try {
                                presignedUrl = r2Service.generatePresignedUrl(legalCase.getResolutionDocumentS3Key());
                        } catch (Exception e) {
                                System.err.println("URL gen failed for resolution doc: " + e.getMessage());
                        }
                }

                return com.jurify.jurify_backend.dto.case_management.ResolutionResponseDTO.builder()
                                .caseId(caseId)
                                .caseTitle(legalCase.getTitle())
                                .status(legalCase.getStatus().name())
                                .resolutionDocumentUrl(presignedUrl)
                                .resolutionNotes(legalCase.getResolutionNotes())
                                .resolutionSubmittedAt(legalCase.getResolutionSubmittedAt())
                                .submittedByName(submitterName)
                                .resolutionAcknowledgedAt(legalCase.getResolutionAcknowledgedAt())
                                .build();
        }

        private String getProviderName(User user) {
                if (user.getLawyer() != null) {
                        return "Adv. " + user.getLawyer().getFirstName() + " " + user.getLawyer().getLastName();
                } else if (user.getNgo() != null) {
                        return user.getNgo().getOrganizationName();
                }
                return user.getEmail();
        }

        @Transactional
        public void markCaseAsRemoved(Long caseId) {
                LegalCase legalCase = legalCaseRepository.findById(caseId)
                                .orElseThrow(() -> new RuntimeException("Case not found"));
                legalCase.setStatus(CaseStatus.REMOVED);
                legalCaseRepository.save(legalCase);

                if (appointmentRepository != null) {
                        appointmentRepository.deleteByCaseId(caseId);
                }
                if (caseMatchRepository != null) {
                        caseMatchRepository.deleteByLegalCaseId(caseId);
                }
        }

        @Transactional
        public void deleteCase(Long caseId) {
                if (chatMessageRepository != null)
                        chatMessageRepository.deleteByCaseId(caseId);
                if (appointmentRepository != null)
                        appointmentRepository.deleteByCaseId(caseId);
                if (reviewRepository != null)
                        reviewRepository.deleteByLegalCaseId(caseId);
                if (caseMatchRepository != null)
                        caseMatchRepository.deleteByLegalCaseId(caseId);

                legalCaseRepository.deleteById(caseId);
        }

        private void syncDirectoryStats(User user) {
                try {
                        com.jurify.jurify_backend.model.DirectoryEntry entry = directoryEntryRepository.findByUser(user)
                                        .orElse(null);
                        if (entry == null)
                                return;

                        long resolvedCount = 0;
                        Double rating = 0.0;

                        if (user.getRole() == UserRole.LAWYER && user.getLawyer() != null) {
                                resolvedCount = legalCaseRepository.countByLawyerIdAndStatus(user.getLawyer().getId(),
                                                CaseStatus.RESOLVED);
                                rating = user.getLawyer().getAverageRating();
                        } else if (user.getRole() == UserRole.NGO && user.getNgo() != null) {
                                resolvedCount = legalCaseRepository.countByNgoIdAndStatus(user.getNgo().getId(),
                                                CaseStatus.RESOLVED);
                                rating = user.getNgo().getAverageRating();
                        }

                        entry.setCasesHandled((int) resolvedCount);
                        entry.setRating(rating);
                        directoryEntryRepository.save(entry);
                } catch (Exception e) {
                        System.err.println("Failed to sync directory stats: " + e.getMessage());
                }
        }

        private void updateLawyerStats(com.jurify.jurify_backend.model.Lawyer lawyer) {
                List<com.jurify.jurify_backend.model.Review> reviews = reviewRepository.findByLawyerId(lawyer.getId());
                if (reviews.isEmpty())
                        return;
                double avg = reviews.stream().mapToInt(com.jurify.jurify_backend.model.Review::getRating).average()
                                .orElse(0.0);
                lawyer.setAverageRating(avg);
                lawyer.setReviewCount(reviews.size());
                lawyerRepository.save(lawyer);
                syncDirectoryStats(lawyer.getUser());
        }

        private void updateNgoStats(com.jurify.jurify_backend.model.NGO ngo) {
                List<com.jurify.jurify_backend.model.Review> reviews = reviewRepository.findByNgoId(ngo.getId());
                if (reviews.isEmpty())
                        return;
                double avg = reviews.stream().mapToInt(com.jurify.jurify_backend.model.Review::getRating).average()
                                .orElse(0.0);
                ngo.setAverageRating(avg);
                ngo.setReviewCount(reviews.size());
                ngoRepository.save(ngo);
                syncDirectoryStats(ngo.getUser());
        }

        @Transactional(readOnly = true)
        public List<Long> getRequestedProviderIds(Long caseId) {
                java.util.Set<Long> userIds = new java.util.HashSet<>();

                // 1. Get providers from CaseMatch table (AI recommendations that were
                // contacted)
                caseMatchRepository.findByLegalCaseIdOrderByMatchScoreDesc(caseId).stream()
                                .filter(m -> m.getStatus() == com.jurify.jurify_backend.model.MatchStatus.CONTACTED
                                                || m.getStatus() == com.jurify.jurify_backend.model.MatchStatus.ACCEPTED)
                                .forEach(m -> {
                                        // Convert entity ID to User ID
                                        if ("LAWYER".equals(m.getProviderType())) {
                                                lawyerRepository.findById(m.getProviderId())
                                                                .ifPresent(l -> userIds.add(l.getUser().getId()));
                                        } else if ("NGO".equals(m.getProviderType())) {
                                                ngoRepository.findById(m.getProviderId())
                                                                .ifPresent(n -> userIds.add(n.getUser().getId()));
                                        }
                                });

                // 2. Get providers from Consultation table (direct requests)
                LegalCase legalCase = legalCaseRepository.findById(caseId).orElse(null);
                if (legalCase != null) {
                        consultationRepository.findByLegalCase(legalCase).forEach(c -> {
                                // Convert entity ID to User ID
                                if ("LAWYER".equals(c.getProviderType())) {
                                        lawyerRepository.findById(c.getProviderId())
                                                        .ifPresent(l -> userIds.add(l.getUser().getId()));
                                } else if ("NGO".equals(c.getProviderType())) {
                                        ngoRepository.findById(c.getProviderId())
                                                        .ifPresent(n -> userIds.add(n.getUser().getId()));
                                }
                        });
                }

                return new java.util.ArrayList<>(userIds);
        }
}
