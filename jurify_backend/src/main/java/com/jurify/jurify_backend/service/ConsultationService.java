package com.jurify.jurify_backend.service;

import com.jurify.jurify_backend.dto.ConsultationLeadDTO;
import com.jurify.jurify_backend.model.*;
import com.jurify.jurify_backend.model.enums.CaseStatus;
import com.jurify.jurify_backend.model.enums.NotificationType;
import com.jurify.jurify_backend.model.enums.UserRole;
import com.jurify.jurify_backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConsultationService {

        private final LegalCaseRepository legalCaseRepository;
        private final CaseMatchRepository caseMatchRepository;
        private final UserRepository userRepository;
        private final EmailService emailService;
        private final LawyerRepository lawyerRepository;
        private final NGORepository ngoRepository;
        private final NotificationService notificationService;

        @Transactional
        public void requestConsultation(String citizenEmail, Long caseId, Long providerId, String providerType) {
                User citizen = userRepository.findByEmail(citizenEmail)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                LegalCase legalCase = legalCaseRepository.findById(caseId)
                                .orElseThrow(() -> new RuntimeException("Case not found"));

                if (!legalCase.getCitizen().getId().equals(citizen.getCitizen().getId())) {
                        throw new RuntimeException("Unauthorized: Not your case");
                }

                // Check if already requested/assigned
                boolean alreadyRequested = caseMatchRepository.findByLegalCase(legalCase).stream()
                                .anyMatch(m -> m.getStatus() == MatchStatus.CONTACTED
                                                || m.getStatus() == MatchStatus.ACCEPTED);

                if (alreadyRequested) {
                        throw new RuntimeException("Consultation already requested for this case");
                }

                CaseMatch match = caseMatchRepository
                                .findByLegalCaseAndProviderIdAndProviderType(legalCase, providerId, providerType)
                                .orElseThrow(() -> new RuntimeException("Match record not found"));

                match.setStatus(MatchStatus.CONTACTED);
                caseMatchRepository.save(match);

                // Notify Provider via Email
                String providerEmail = "";
                String providerName = "";
                if ("LAWYER".equalsIgnoreCase(providerType)) {
                        Lawyer lawyer = lawyerRepository.findById(providerId).orElseThrow();
                        providerEmail = lawyer.getUser().getEmail();
                        providerName = lawyer.getFirstName();
                } else {
                        NGO ngo = ngoRepository.findById(providerId).orElseThrow();
                        providerEmail = ngo.getUser().getEmail();
                        providerName = ngo.getOrganizationName();
                }

                emailService.sendGeneralEmail(
                                providerEmail,
                                "New Consultation Request: " + legalCase.getTitle(),
                                "New Consultation Request",
                                "Hello " + providerName
                                                + ",<br><br>You have received a new consultation request for the case: <strong>"
                                                + legalCase.getTitle() + "</strong>.<br><br>" +
                                                "Please log in to your dashboard to review the case details and accept or reject the request.",
                                "View Request",
                                "http://localhost:5173/dashboard" // Adjust to specific dashboard URL if needed
                );

                // Notify Citizen
                emailService.sendGeneralEmail(
                                citizenEmail,
                                "Consultation Requested",
                                "Request Sent Successfully",
                                "Your consultation request has been sent to <strong>" + providerName
                                                + "</strong>.<br><br>" +
                                                "You will be notified via email and in-app notification once they accept your request.",
                                "View Case Status",
                                "http://localhost:5173/case/" + legalCase.getId());

                // Create In-App Notification for Provider
                User providerUser = "LAWYER".equalsIgnoreCase(providerType)
                                ? lawyerRepository.findById(providerId).orElseThrow().getUser()
                                : ngoRepository.findById(providerId).orElseThrow().getUser();

                notificationService.createNotification(Notification.builder()
                                .userId(providerUser.getId())
                                .type(NotificationType.CASE)
                                .title("New Consultation Request")
                                .message("You have a new consultation request for case: " + legalCase.getTitle()
                                                + ". Please review the details in your dashboard.")
                                .build());
        }

        @Transactional
        public void acceptConsultation(String providerEmail, Long caseId) {
                User provider = userRepository.findByEmail(providerEmail)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                Long providerId;
                String providerType;

                if (provider.getRole() == UserRole.LAWYER) {
                        providerId = provider.getLawyer().getId();
                        providerType = "LAWYER";
                } else if (provider.getRole() == UserRole.NGO) {
                        providerId = provider.getNgo().getId();
                        providerType = "NGO";
                } else {
                        throw new RuntimeException("Only Lawyers or NGOs can accept cases");
                }

                LegalCase legalCase = legalCaseRepository.findById(caseId)
                                .orElseThrow(() -> new RuntimeException("Case not found"));

                if (legalCase.getStatus() != CaseStatus.PENDING) {
                        throw new RuntimeException("Case is no longer available");
                }

                // Find the match record for this provider
                CaseMatch myMatch = caseMatchRepository
                                .findByLegalCaseAndProviderIdAndProviderType(legalCase, providerId, providerType)
                                .orElseThrow(() -> new RuntimeException("You are not matched with this case"));

                // Assign Case
                if (provider.getRole() == UserRole.LAWYER) {
                        legalCase.setLawyer(provider.getLawyer());
                } else if (provider.getRole() == UserRole.NGO) {
                        legalCase.setNgo(provider.getNgo());
                }

                legalCase.setStatus(CaseStatus.ACTIVE); // Or ASSIGNED
                legalCaseRepository.saveAndFlush(legalCase);

                // Update Match Statuses
                List<CaseMatch> allMatches = caseMatchRepository.findByLegalCase(legalCase);
                for (CaseMatch match : allMatches) {
                        if (match.getId().equals(myMatch.getId())) {
                                match.setStatus(MatchStatus.ACCEPTED);
                        } else {
                                match.setStatus(MatchStatus.EXPIRED);
                        }
                }
                caseMatchRepository.saveAll(allMatches);

                // Notify Citizen
                String citizenEmail = legalCase.getCitizen().getUser().getEmail();
                String providerDisplayName = (provider.getRole() == UserRole.LAWYER
                                ? "Adv. " + provider.getLawyer().getLastName()
                                : provider.getNgo().getOrganizationName());

                emailService.sendGeneralEmail(
                                citizenEmail,
                                "Case Accepted!",
                                "Great News!",
                                "Your case <strong>" + legalCase.getTitle() + "</strong> has been accepted by <strong>"
                                                + providerDisplayName + "</strong>.<br><br>" +
                                                "You can now start communicating with your legal provider to move your case forward.",
                                "Open Chat",
                                "http://localhost:5173/chat" // Link to chat directly
                );

                // Create In-App Notification for Citizen
                notificationService.createNotification(Notification.builder()
                                .userId(legalCase.getCitizen().getUser().getId())
                                .type(NotificationType.CASE)
                                .title("Case Accepted")
                                .message("Your case " + legalCase.getTitle()
                                                + " has been accepted. Check your dashboard for next steps.")
                                .build());
        }

        @Transactional(readOnly = true)
        public List<ConsultationLeadDTO> getLeads(String providerEmail) {
                User provider = userRepository.findByEmail(providerEmail)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                Long providerId;
                String providerType;
                if (provider.getRole() == UserRole.LAWYER) {
                        providerId = provider.getLawyer().getId();
                        providerType = "LAWYER";
                } else if (provider.getRole() == UserRole.NGO) {
                        providerId = provider.getNgo().getId();
                        providerType = "NGO";
                } else {
                        return List.of();
                }

                List<CaseMatch> matches = caseMatchRepository.findByProviderIdAndProviderType(providerId, providerType);

                return matches.stream()
                                .filter(m -> m.getLegalCase().getStatus() == CaseStatus.PENDING)
                                .filter(m -> m.getStatus() == MatchStatus.SUGGESTED
                                                || m.getStatus() == MatchStatus.CONTACTED
                                                || m.getStatus() == MatchStatus.VIEWED) // Exclude ACCEPTED/EXPIRED
                                .map(m -> ConsultationLeadDTO.builder()
                                                .caseId(m.getLegalCase().getId())
                                                .caseTitle(m.getLegalCase().getTitle())
                                                .caseStatus(m.getLegalCase().getStatus().name())
                                                .citizenName(m.getLegalCase().getCitizen().getFirstName())
                                                .location(m.getLegalCase().getLocation().getCity())
                                                .urgency(m.getLegalCase().getUrgency() != null
                                                                ? m.getLegalCase().getUrgency().name()
                                                                : "N/A")
                                                .requestedAt(m.getCreatedAt())
                                                .matchStatus(m.getStatus().name())
                                                .description(m.getLegalCase().getDescription())
                                                .category(m.getLegalCase().getCategory() != null
                                                                ? m.getLegalCase().getCategory()
                                                                : "Uncategorized")
                                                .build())
                                .collect(Collectors.toList());
        }
}
