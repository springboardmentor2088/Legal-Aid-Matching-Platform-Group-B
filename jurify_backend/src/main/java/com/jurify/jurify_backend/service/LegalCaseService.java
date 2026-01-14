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

        @org.springframework.beans.factory.annotation.Value("${cloudflare.r2.public-url}")
        private String r2PublicUrl;

        @Transactional(readOnly = true)
        public List<LegalCaseDTO> getCasesForUser(String email) {
                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                if (user.getRole() == UserRole.CITIZEN && user.getCitizen() != null) {
                        return legalCaseRepository.findByCitizenId(user.getCitizen().getId()).stream()
                                        .map(lc -> mapToDTO(lc, email))
                                        .collect(Collectors.toList());
                } else if (user.getRole() == UserRole.LAWYER && user.getLawyer() != null) {
                        return legalCaseRepository.findByLawyerId(user.getLawyer().getId()).stream()
                                        .map(lc -> mapToDTO(lc, email))
                                        .collect(Collectors.toList());

                } else if (user.getRole() == UserRole.NGO && user.getNgo() != null) {
                        return legalCaseRepository.findByNgoId(user.getNgo().getId()).stream()
                                        .map(lc -> mapToDTO(lc, email))
                                        .collect(Collectors.toList());
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
}
