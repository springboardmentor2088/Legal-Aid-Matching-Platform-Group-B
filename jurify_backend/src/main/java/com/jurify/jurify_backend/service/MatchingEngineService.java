package com.jurify.jurify_backend.service;

import com.jurify.jurify_backend.dto.MatchResponseDTO;
import com.jurify.jurify_backend.model.*;
import com.jurify.jurify_backend.repository.CaseMatchRepository;
import com.jurify.jurify_backend.repository.LawyerRepository;
import com.jurify.jurify_backend.repository.LegalCaseRepository;
import com.jurify.jurify_backend.repository.NGORepository;
import com.jurify.jurify_backend.model.enums.NotificationType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MatchingEngineService {

    private final LegalCaseRepository legalCaseRepository;
    private final LawyerRepository lawyerRepository;
    private final NGORepository ngoRepository;
    private final CaseMatchRepository caseMatchRepository;
    private final NotificationService notificationService;

    @Transactional
    public List<MatchResponseDTO> generateMatches(Long caseId) {
        LegalCase legalCase = legalCaseRepository.findById(caseId)
                .orElseThrow(() -> new RuntimeException("Case not found"));

        // Clear previous matches
        caseMatchRepository.deleteByLegalCase(legalCase);

        List<CaseMatch> matches = new ArrayList<>();
        List<MatchResponseDTO> dtos = new ArrayList<>();

        // 1. Match Lawyers
        // Relaxed matching: Fetch all lawyers in the same state (verified or not)
        String caseState = getCaseState(legalCase);
        List<Lawyer> lawyers = lawyerRepository.findByState(caseState);

        // Fallback: If no lawyers in state, fetch all lawyers
        if (lawyers.isEmpty()) {
            lawyers = lawyerRepository.findAll();
        }

        for (Lawyer lawyer : lawyers) {
            double score = calculateLawyerScore(legalCase, lawyer);
            if (score > 1) {
                CaseMatch match = CaseMatch.builder()
                        .legalCase(legalCase)
                        .providerId(lawyer.getId())
                        .providerType("LAWYER")
                        .matchScore(score)
                        .matchReasons(generateReason(score))
                        .status(MatchStatus.SUGGESTED)
                        .build();
                matches.add(match);
                dtos.add(mapToDto(match, lawyer));

                // Notify Lawyer
                if (lawyer.getUser() != null) {
                    notificationService.createNotification(Notification.builder()
                            .userId(lawyer.getUser().getId())
                            .type(NotificationType.CASE)
                            .title("New Case Lead")
                            .message("You have a new case match: " + legalCase.getTitle())
                            .caseId(legalCase.getId())
                            .build());
                }
            }
        }

        // 2. Match NGOs
        // Relaxed matching: Fetch all NGOs in the same state (verified or not)
        List<NGO> ngos = ngoRepository.findByState(caseState);

        // Fallback: If no NGOs in state, fetch all NGOs
        if (ngos.isEmpty()) {
            ngos = ngoRepository.findAll();
        }
        for (NGO ngo : ngos) {
            double score = calculateNgoScore(legalCase, ngo);
            if (score > 1) {
                CaseMatch match = CaseMatch.builder()
                        .legalCase(legalCase)
                        .providerId(ngo.getId())
                        .providerType("NGO")
                        .matchScore(score)
                        .matchReasons(generateReason(score))
                        .status(MatchStatus.SUGGESTED)
                        .build();
                matches.add(match);
                dtos.add(mapToDto(match, ngo));

                // Notify NGO
                if (ngo.getUser() != null) {
                    notificationService.createNotification(Notification.builder()
                            .userId(ngo.getUser().getId())
                            .type(NotificationType.CASE)
                            .title("New Case Lead")
                            .message("You have a new case match: " + legalCase.getTitle())
                            .caseId(legalCase.getId())
                            .build());
                }
            }
        }

        // Sort both by score desc
        matches.sort(Comparator.comparingDouble(CaseMatch::getMatchScore).reversed());
        dtos.sort(Comparator.comparingDouble(MatchResponseDTO::getMatchScore).reversed());

        // Limit to top 5 Lawyers and top 5 NGOs
        List<CaseMatch> lawyerMatches = matches.stream()
                .filter(m -> "LAWYER".equals(m.getProviderType()))
                .limit(5)
                .collect(Collectors.toList());

        List<CaseMatch> ngoMatches = matches.stream()
                .filter(m -> "NGO".equals(m.getProviderType()))
                .limit(5)
                .collect(Collectors.toList());

        List<CaseMatch> finalMatches = new ArrayList<>();
        finalMatches.addAll(lawyerMatches);
        finalMatches.addAll(ngoMatches);

        // Sort final list by score desc
        finalMatches.sort(Comparator.comparingDouble(CaseMatch::getMatchScore).reversed());

        caseMatchRepository.saveAll(finalMatches);

        // Map to DTOs
        List<MatchResponseDTO> finalDtos = new ArrayList<>();
        // Re-fetch objects or use existing maps to be efficient, but simplicity first:
        for (CaseMatch m : finalMatches) {
            if ("LAWYER".equals(m.getProviderType())) {
                // Find matching lawyer obj
                Lawyer l = lawyers.stream().filter(lawyer -> lawyer.getId().equals(m.getProviderId())).findFirst()
                        .orElse(null);
                if (l != null)
                    finalDtos.add(mapToDto(m, l));
            } else {
                NGO n = ngos.stream().filter(ngo -> ngo.getId().equals(m.getProviderId())).findFirst().orElse(null);
                if (n != null)
                    finalDtos.add(mapToDto(m, n));
            }
        }

        return finalDtos;
    }

    @Transactional
    public void generateMatchesForProvider(Long providerId, String providerType) {
        // 1. Fetch Provider
        Lawyer lawyer = null;
        NGO ngo = null;
        String providerState = null;

        if ("LAWYER".equalsIgnoreCase(providerType)) {
            lawyer = lawyerRepository.findById(providerId).orElse(null);
            if (lawyer == null)
                return;
            providerState = lawyer.getState();
        } else if ("NGO".equalsIgnoreCase(providerType)) {
            ngo = ngoRepository.findById(providerId).orElse(null);
            if (ngo == null)
                return;
            providerState = ngo.getState();
        } else {
            return;
        }

        // 2. Fetch Pending Cases (Filtered by State for Optimization)
        List<LegalCase> pendingCases;
        if (providerState != null && !providerState.isEmpty()) {
            pendingCases = legalCaseRepository.findByStatusAndLocationState(
                    com.jurify.jurify_backend.model.enums.CaseStatus.PENDING, providerState);
        } else {
            pendingCases = legalCaseRepository.findByStatus(com.jurify.jurify_backend.model.enums.CaseStatus.PENDING);
        }

        List<CaseMatch> newMatches = new ArrayList<>();

        // 3. Match
        for (LegalCase legalCase : pendingCases) {
            // Check if match already exists
            if (caseMatchRepository
                    .findByLegalCaseAndProviderIdAndProviderType(legalCase, providerId, providerType.toUpperCase())
                    .isPresent()) {
                continue;
            }

            double score = 0;
            if (lawyer != null) {
                score = calculateLawyerScore(legalCase, lawyer);
            } else if (ngo != null) {
                score = calculateNgoScore(legalCase, ngo);
            }

            if (score > 1) {
                CaseMatch match = CaseMatch.builder()
                        .legalCase(legalCase)
                        .providerId(providerId)
                        .providerType(providerType.toUpperCase())
                        .matchScore(score)
                        .matchReasons(generateReason(score))
                        .status(MatchStatus.SUGGESTED)
                        .build();
                newMatches.add(match);

                // Notify Provider
                notificationService.createNotification(Notification.builder()
                        .userId(lawyer != null ? lawyer.getUser().getId() : ngo.getUser().getId())
                        .type(NotificationType.CASE)
                        .title("New Case Match")
                        .message("You have a new case match: " + legalCase.getTitle())
                        .caseId(legalCase.getId())
                        .build());
            }
        }

        if (!newMatches.isEmpty()) {
            caseMatchRepository.saveAll(newMatches);
        }
    }

    private MatchResponseDTO mapToDto(CaseMatch match, Lawyer lawyer) {
        return MatchResponseDTO.builder()
                .providerId(lawyer.getId())
                .providerType("LAWYER")
                .name("Adv. " + lawyer.getFirstName() + " " + lawyer.getLastName())
                .expertise(getAllSpecializations(lawyer))
                .location(lawyer.getCity() + ", " + lawyer.getState())
                .bio(lawyer.getBio() != null ? lawyer.getBio() : "No bio available")
                .matchScore(match.getMatchScore())
                .matchScore(match.getMatchScore())
                .matchReason(match.getMatchReasons())
                .rating(lawyer.getAverageRating() != null ? lawyer.getAverageRating() : 0.0)
                .experience(lawyer.getYearsOfExperience() != null ? lawyer.getYearsOfExperience() + " yrs" : "N/A")
                .casesHandled(lawyer.getCasesHandled() != null ? lawyer.getCasesHandled() : 0)
                .contact(lawyer.getPhoneNumber())
                .email(lawyer.getUser() != null ? lawyer.getUser().getEmail() : "")
                .isAvailable(lawyer.getIsAvailable())
                .color("bg-teal-600")
                .build();
    }

    private MatchResponseDTO mapToDto(CaseMatch match, NGO ngo) {
        return MatchResponseDTO.builder()
                .providerId(ngo.getId())
                .providerType("NGO")
                .name(ngo.getOrganizationName())
                .expertise(ngo.getServiceAreas() != null && !ngo.getServiceAreas().isEmpty() ? ngo.getServiceAreas()
                        : java.util.List.of("Social Work"))
                .location(ngo.getCity() + ", " + ngo.getState())
                .bio(ngo.getDescription() != null ? ngo.getDescription() : "No description available")
                .matchScore(match.getMatchScore())
                .matchReason(match.getMatchReasons())
                .rating(ngo.getAverageRating() != null ? ngo.getAverageRating() : 0.0)
                .experience("Active")
                .casesHandled(ngo.getCasesHandled() != null ? ngo.getCasesHandled() : 0)
                .contact(ngo.getOrganizationPhone())
                .email(ngo.getUser() != null ? ngo.getUser().getEmail() : "")
                .isAvailable(ngo.getIsActive())
                .color("bg-emerald-600")
                .build();
    }

    private java.util.List<String> getAllSpecializations(Lawyer lawyer) {
        if (lawyer.getSpecializations() == null || lawyer.getSpecializations().isEmpty())
            return java.util.List.of("General Practice");
        return lawyer.getSpecializations().stream()
                .map(s -> s.getLegalCategory().getName())
                .collect(Collectors.toList());
    }

    private String getCaseState(LegalCase legalCase) {
        if (legalCase.getLocation() != null && legalCase.getLocation().getState() != null)
            return legalCase.getLocation().getState();
        return "";
    }

    private double calculateLawyerScore(LegalCase legalCase, Lawyer lawyer) {
        // 0. STRICT FILTERS
        // A. Language Filter
        if (legalCase.getPreferredLanguage() != null) {
            if (lawyer.getLanguages() == null || !lawyer.getLanguages().toLowerCase()
                    .contains(legalCase.getPreferredLanguage().name().toLowerCase())) {
                return 0; // Exclude if language doesn't match
            }
        }

        // B. Category/Specialization Filter
        String category = legalCase.getCategory();
        if (category != null && !category.isEmpty()) {
            if (lawyer.getSpecializations() == null || lawyer.getSpecializations().isEmpty()) {
                return 0; // Exclude if no specializations
            }
            boolean expertiseMatch = lawyer.getSpecializations().stream()
                    .anyMatch(spec -> spec.getLegalCategory().getName().equalsIgnoreCase(category));
            if (!expertiseMatch) {
                return 0; // Exclude if specialization doesn't match
            }
        } else {
            // If case has no category, maybe allow? Or strictly exclude?
            // Usually cases have category. If not, safe to return 0 or low score?
            // Assuming valid cases have categories.
        }

        double score = 10; // Base score for any lawyer

        // 1. State Match (bonus)
        String caseState = getCaseState(legalCase);
        if (caseState != null && !caseState.isEmpty()) {
            if (lawyer.getState() != null && caseState.equalsIgnoreCase(lawyer.getState())) {
                score += 20; // State match bonus
                // City Bonus
                if (legalCase.getLocation() != null && legalCase.getLocation().getCity() != null
                        && legalCase.getLocation().getCity().equalsIgnoreCase(lawyer.getCity())) {
                    score += 10;
                }
            }
        }

        // 2. Category/Specialization Bonus (We already strictly matched, but can give
        // points for it being a match?)
        // Since we strictly matched above, we know it matches. We can keep the points
        // to prioritize it over others if needed,
        // or just consider it part of the base validation.
        // Let's keep the points so 'specialized' matches rank higher if we had partial
        // matches (but we don't anymore).
        // Actually, let's keep it to boost score so it > 1.
        score += 40;

        // 3. Language Bonus (Already matched strictly)
        score += 20;

        // Availability Bonus
        if (Boolean.TRUE.equals(lawyer.getIsAvailable())) {
            score += 10;
        }

        // Verification Bonus
        if (Boolean.TRUE.equals(lawyer.getIsVerified())) {
            score += 15;
        }

        // Cap at 100%
        return Math.min(score, 100);
    }

    private double calculateNgoScore(LegalCase legalCase, NGO ngo) {
        // 0. STRICT FILTERS
        // A. Language Filter
        if (legalCase.getPreferredLanguage() != null) {
            if (ngo.getLanguages() == null || !ngo.getLanguages().toLowerCase()
                    .contains(legalCase.getPreferredLanguage().name().toLowerCase())) {
                return 0; // Exclude
            }
        }

        // B. Category/Specialization Filter
        String category = legalCase.getCategory();
        if (category != null && !category.isEmpty()) {
            if (ngo.getSpecializations() == null || ngo.getSpecializations().isEmpty()) {
                return 0; // Exclude
            }
            boolean expertiseMatch = ngo.getSpecializations().stream()
                    .anyMatch(spec -> spec.getLegalCategory().getName().equalsIgnoreCase(category));
            if (!expertiseMatch) {
                return 0; // Exclude
            }
        }

        double score = 10; // Base score for any NGO

        // 1. State Match (bonus)
        String caseState = getCaseState(legalCase);
        if (caseState != null && !caseState.isEmpty()) {
            if (ngo.getState() != null && caseState.equalsIgnoreCase(ngo.getState())) {
                score += 20; // State match bonus
                if (legalCase.getLocation() != null && legalCase.getLocation().getCity() != null
                        && legalCase.getLocation().getCity().equalsIgnoreCase(ngo.getCity())) {
                    score += 10;
                }
            }
        }

        // 2. Category Bonus (Already matched)
        score += 40;

        // Activity Bonus
        if (Boolean.TRUE.equals(ngo.getIsActive())) {
            score += 10;
        }

        // Verification Bonus
        if (Boolean.TRUE.equals(ngo.getIsVerified())) {
            score += 15;
        }

        // Cap at 100%
        return Math.min(score, 100);
    }

    private String generateReason(double score) {
        if (score >= 90)
            return "Excellent Match";
        if (score >= 70)
            return "Great Match";
        if (score >= 50)
            return "Good Match";
        return "Potential Match";
    }
}
