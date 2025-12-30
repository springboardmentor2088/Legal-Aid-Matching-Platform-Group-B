package com.jurify.jurify_backend.service;

import com.jurify.jurify_backend.dto.case_management.CaseStatsDTO;
import com.jurify.jurify_backend.dto.case_management.LegalCaseDTO;
import com.jurify.jurify_backend.model.LegalCase;
import com.jurify.jurify_backend.model.User;
import com.jurify.jurify_backend.model.enums.CaseStatus;
import com.jurify.jurify_backend.model.enums.UserRole;
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
        private final com.jurify.jurify_backend.repository.CaseDocumentRepository caseDocumentRepository;

        @org.springframework.beans.factory.annotation.Value("${cloudflare.r2.public-url}")
        private String r2PublicUrl;

        @Transactional(readOnly = true)
        public List<LegalCaseDTO> getCasesForUser(String email) {
                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                if (user.getRole() == UserRole.CITIZEN && user.getCitizen() != null) {
                        return legalCaseRepository.findByCitizenId(user.getCitizen().getId()).stream()
                                        .map(this::mapToDTO)
                                        .collect(Collectors.toList());
                }
                // TODO: Add logic for Lawyer role if needed
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
                }
                return CaseStatsDTO.builder().totalCases(0L).activeCases(0L).pendingCases(0L).resolvedCases(0L).build();
        }

        @Transactional
        public void createCase(String email, com.jurify.jurify_backend.dto.case_management.CreateCaseRequest request,
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
                                .category(request.getCategory() != null
                                                ? com.jurify.jurify_backend.model.enums.CaseCategory
                                                                .valueOf(request.getCategory().toUpperCase()
                                                                                .replace(" ", "_"))
                                                : null)
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
                                // I need CaseDocumentRepository injected too if I want to save them explicitly,
                                // but since I set CascadeType.ALL on LegalCase, I can just add them to the list
                                // and save LegalCase again?
                                // Actually, I should probably save them via repository or rely on cascade.
                                // But LegalCase is already saved. Let's rely on cascade by setting the list and
                                // saving again or use repository.
                                // Using repository is safer/clearer usually if we want distinct saves.
                                // But let's check imports.
                                caseDocumentRepository.saveAll(caseDocuments);
                        }
                }
        }

        @Transactional(readOnly = true)
        public LegalCaseDTO getCaseById(Long id, String email) {
                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                LegalCase legalCase = legalCaseRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Case not found"));

                // Access Control
                boolean isOwner = legalCase.getCitizen() != null
                                && legalCase.getCitizen().getId().equals(user.getCitizen().getId());
                boolean isAssignedLawyer = legalCase.getLawyer() != null && user.getLawyer() != null
                                && legalCase.getLawyer().getId().equals(user.getLawyer().getId());

                if (!isOwner && !isAssignedLawyer) {
                        throw new RuntimeException("Access denied");
                }

                return mapToDTO(legalCase);
        }

        private LegalCaseDTO mapToDTO(LegalCase legalCase) {
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

                return LegalCaseDTO.builder()
                                .id(legalCase.getId())
                                .title(legalCase.getTitle())
                                .description(legalCase.getDescription())
                                .status(legalCase.getStatus())
                                .lawyerName(legalCase.getLawyer() != null
                                                ? legalCase.getLawyer().getFirstName() + " "
                                                                + legalCase.getLawyer().getLastName()
                                                : "Unassigned")
                                .category(legalCase.getCategory() != null ? legalCase.getCategory().name() : null)
                                .urgency(legalCase.getUrgency() != null ? legalCase.getUrgency().name() : null)
                                .preferredLanguage(
                                                legalCase.getPreferredLanguage() != null
                                                                ? legalCase.getPreferredLanguage().name()
                                                                : null)
                                .locationCity(legalCase.getLocation() != null ? legalCase.getLocation().getCity()
                                                : null)
                                .documents(documentDTOs)
                                .createdAt(legalCase.getCreatedAt())
                                .updatedAt(legalCase.getUpdatedAt())
                                .build();
        }
}
