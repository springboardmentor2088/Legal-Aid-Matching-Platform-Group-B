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
                    .activeCases(legalCaseRepository.countByCitizenIdAndStatus(citizenId, CaseStatus.ACTIVE))
                    .pendingCases(legalCaseRepository.countByCitizenIdAndStatus(citizenId, CaseStatus.PENDING))
                    .resolvedCases(legalCaseRepository.countByCitizenIdAndStatus(citizenId, CaseStatus.RESOLVED))
                    .build();
        }
        return CaseStatsDTO.builder().totalCases(0L).activeCases(0L).pendingCases(0L).resolvedCases(0L).build();
    }

    private LegalCaseDTO mapToDTO(LegalCase legalCase) {
        return LegalCaseDTO.builder()
                .id(legalCase.getId())
                .title(legalCase.getTitle())
                .description(legalCase.getDescription())
                .status(legalCase.getStatus())
                .lawyerName(legalCase.getLawyer() != null
                        ? legalCase.getLawyer().getFirstName() + " " + legalCase.getLawyer().getLastName()
                        : "Unassigned")
                .createdAt(legalCase.getCreatedAt())
                .updatedAt(legalCase.getUpdatedAt())
                .build();
    }
}
