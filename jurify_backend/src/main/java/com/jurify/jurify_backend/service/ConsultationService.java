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
        private final ConsultationRepository consultationRepository;
        private final UserRepository userRepository;
        private final EmailService emailService;
        private final LawyerRepository lawyerRepository;
        private final NGORepository ngoRepository;
        private final NotificationService notificationService;
        private final CloudflareR2Service cloudflareR2Service;

        @Transactional
        public void requestConsultation(String citizenEmail, Long caseId, Long providerId, String providerType) {
                User citizen = userRepository.findByEmail(citizenEmail)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                LegalCase legalCase = legalCaseRepository.findById(caseId)
                                .orElseThrow(() -> new RuntimeException("Case not found"));

                if (!legalCase.getCitizen().getId().equals(citizen.getCitizen().getId())) {
                        throw new RuntimeException("Unauthorized: Not your case");
                }

                // CRITICAL FIX: The frontend sends the User ID, but we need the entity ID.
                // Resolve the provider entity and get its actual PK.
                Long resolvedProviderId;
                Lawyer lawyer = null;
                NGO ngo = null;
                String providerEmail = "";
                String providerName = "";
                User providerUser = null;

                if ("LAWYER".equalsIgnoreCase(providerType)) {
                        // Try finding by User ID first (from Directory), fallback to entity ID
                        lawyer = lawyerRepository.findByUser_Id(providerId)
                                        .orElseGet(() -> lawyerRepository.findById(providerId).orElse(null));
                        if (lawyer == null) {
                                throw new RuntimeException("Lawyer not found for ID: " + providerId);
                        }
                        resolvedProviderId = lawyer.getId();
                        providerEmail = lawyer.getUser().getEmail();
                        providerName = lawyer.getFirstName();
                        providerUser = lawyer.getUser();
                } else {
                        // Try finding by User ID first (from Directory), fallback to entity ID
                        ngo = ngoRepository.findByUser_Id(providerId)
                                        .orElseGet(() -> ngoRepository.findById(providerId).orElse(null));
                        if (ngo == null) {
                                throw new RuntimeException("NGO not found for ID: " + providerId);
                        }
                        resolvedProviderId = ngo.getId();
                        providerEmail = ngo.getUser().getEmail();
                        providerName = ngo.getOrganizationName();
                        providerUser = ngo.getUser();
                }

                // Check if already requested/assigned using the RESOLVED entity ID
                boolean alreadyRequested = consultationRepository
                                .findByLegalCaseAndProviderIdAndProviderType(legalCase, resolvedProviderId,
                                                providerType.toUpperCase())
                                .isPresent();

                if (alreadyRequested) {
                        throw new RuntimeException("Consultation already requested for this professional");
                }

                // Create a formal Consultation record with the RESOLVED entity ID
                Consultation consultation = Consultation.builder()
                                .legalCase(legalCase)
                                .providerId(resolvedProviderId)
                                .providerType(providerType.toUpperCase())
                                .status(com.jurify.jurify_backend.model.enums.ConsultationStatus.PENDING)
                                .build();

                consultationRepository.save(consultation);

                // Update CaseMatch status if it exists (Discovery -> Engagement)
                caseMatchRepository
                                .findByLegalCaseAndProviderIdAndProviderType(legalCase, resolvedProviderId,
                                                providerType.toUpperCase())
                                .ifPresent(match -> {
                                        match.setStatus(MatchStatus.CONTACTED);
                                        caseMatchRepository.save(match);
                                });

                // Notify Provider via Email (wrapped in try-catch for robustness)
                try {
                        emailService.sendGeneralEmail(
                                        providerEmail,
                                        "New Consultation Request: " + legalCase.getTitle(),
                                        "New Consultation Request",
                                        "Hello " + providerName
                                                        + ",<br><br>You have received a new consultation request for the case: <strong>"
                                                        + legalCase.getTitle() + "</strong>.<br><br>" +
                                                        "Please log in to your dashboard to review the case details and accept or reject the request.",
                                        "View Request",
                                        "http://localhost:5173/dashboard");
                } catch (Exception e) {
                        System.err.println("Failed to send email to provider: " + e.getMessage());
                }

                // Notify Citizen (wrapped in try-catch for robustness)
                try {
                        emailService.sendGeneralEmail(
                                        citizenEmail,
                                        "Consultation Requested",
                                        "Request Sent Successfully",
                                        "Your consultation request has been sent to <strong>" + providerName
                                                        + "</strong>.<br><br>" +
                                                        "You will be notified via email and in-app notification once they accept your request.",
                                        "View Case Status",
                                        "http://localhost:5173/case/" + legalCase.getId());
                } catch (Exception e) {
                        System.err.println("Failed to send email to citizen: " + e.getMessage());
                }

                // Create In-App Notification for Provider
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

                // Find the formal consultation record
                Consultation consultation = consultationRepository
                                .findByLegalCaseAndProviderIdAndProviderType(legalCase, providerId, providerType)
                                .orElse(null);

                // If no formal consultation exists, check if there's a valid CaseMatch (AI
                // Suggestion)
                if (consultation == null) {
                        CaseMatch match = caseMatchRepository
                                        .findByLegalCaseAndProviderIdAndProviderType(legalCase, providerId,
                                                        providerType)
                                        .orElseThrow(() -> new RuntimeException(
                                                        "No consultation request or match found for this case"));

                        // Create a new Consultation record from the match
                        consultation = Consultation.builder()
                                        .legalCase(legalCase)
                                        .providerId(providerId)
                                        .providerType(providerType)
                                        .status(com.jurify.jurify_backend.model.enums.ConsultationStatus.PENDING)
                                        .build();
                        consultationRepository.save(consultation);
                }

                // Assign Case
                if (provider.getRole() == UserRole.LAWYER) {
                        legalCase.setLawyer(provider.getLawyer());
                } else if (provider.getRole() == UserRole.NGO) {
                        legalCase.setNgo(provider.getNgo());
                }

                legalCase.setStatus(CaseStatus.ACTIVE);
                legalCaseRepository.saveAndFlush(legalCase);

                // Update Consultation Status
                consultation.setStatus(com.jurify.jurify_backend.model.enums.ConsultationStatus.ACCEPTED);
                consultationRepository.save(consultation);

                // Update Match statuses: The accepted one is matching, others expire
                List<CaseMatch> allMatches = caseMatchRepository.findByLegalCase(legalCase);
                for (CaseMatch match : allMatches) {
                        if (match.getProviderId().equals(providerId) && match.getProviderType().equals(providerType)) {
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
                                "http://localhost:5173/chat");

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
        public List<ConsultationLeadDTO> getCitizenConsultations(String citizenEmail) {
                User user = userRepository.findByEmail(citizenEmail)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                if (user.getRole() != UserRole.CITIZEN || user.getCitizen() == null) {
                        throw new RuntimeException("Only citizens can view their consultations");
                }

                List<LegalCase> myCases = legalCaseRepository.findByCitizenId(user.getCitizen().getId());
                java.util.List<Consultation> consultations = new java.util.ArrayList<>();
                for (LegalCase lc : myCases) {
                        consultations.addAll(consultationRepository.findByLegalCase(lc));
                }

                return consultations.stream()
                                .map(c -> {
                                        ConsultationLeadDTO dto = mapConsultationToDTO(c);
                                        // Add provider name for citizen view
                                        String providerName = "";
                                        if ("LAWYER".equals(c.getProviderType())) {
                                                Lawyer l = lawyerRepository.findById(c.getProviderId()).orElse(null);
                                                if (l != null)
                                                        providerName = "Adv. " + l.getFirstName() + " "
                                                                        + l.getLastName();
                                        } else {
                                                NGO n = ngoRepository.findById(c.getProviderId()).orElse(null);
                                                if (n != null)
                                                        providerName = n.getOrganizationName();
                                        }
                                        dto.setProviderName(providerName);
                                        return dto;
                                })
                                .collect(Collectors.toList());
        }

        @Transactional
        public void rejectConsultation(String providerEmail, Long caseId) {
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
                        throw new RuntimeException("Only Lawyers or NGOs can reject cases");
                }

                LegalCase legalCase = legalCaseRepository.findById(caseId)
                                .orElseThrow(() -> new RuntimeException("Case not found"));

                // 1. Update formal consultation if it exists
                consultationRepository.findByLegalCaseAndProviderIdAndProviderType(legalCase, providerId, providerType)
                                .ifPresent(c -> {
                                        c.setStatus(com.jurify.jurify_backend.model.enums.ConsultationStatus.REJECTED);
                                        consultationRepository.save(c);
                                });

                // 2. Update AI Match if it exists
                caseMatchRepository.findByLegalCaseAndProviderIdAndProviderType(legalCase, providerId, providerType)
                                .ifPresent(m -> {
                                        m.setStatus(MatchStatus.REJECTED);
                                        caseMatchRepository.save(m);
                                });
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

                // 1. Get formal consultations (Direct requests)
                List<Consultation> consultations = consultationRepository.findByProviderIdAndProviderTypeAndStatus(
                                providerId, providerType,
                                com.jurify.jurify_backend.model.enums.ConsultationStatus.PENDING);

                // 2. Get AI suggestions from CaseMatch
                List<CaseMatch> matches = caseMatchRepository.findByProviderIdAndProviderType(providerId, providerType);

                // Map AI suggestions first (they might be overridden by formal consultations)
                java.util.Map<Long, ConsultationLeadDTO> leadsMap = matches.stream()
                                .filter(m -> m.getLegalCase().getStatus() == CaseStatus.PENDING)
                                .filter(m -> m.getStatus() == MatchStatus.SUGGESTED
                                                || m.getStatus() == MatchStatus.VIEWED)
                                .map(m -> mapMatchToDTO(m))
                                .collect(Collectors.toMap(ConsultationLeadDTO::getCaseId, dto -> dto,
                                                (existing, replacement) -> existing));

                // Add/Overwrite with formal consultations (Marked as CONTACTED/SPECIFIC)
                for (Consultation c : consultations) {
                        if (c.getLegalCase().getStatus() == CaseStatus.PENDING) {
                                leadsMap.put(c.getLegalCase().getId(), mapConsultationToDTO(c));
                        }
                }

                return new java.util.ArrayList<>(leadsMap.values());
        }

        private ConsultationLeadDTO mapMatchToDTO(CaseMatch m) {
                return ConsultationLeadDTO.builder()
                                .caseId(m.getLegalCase().getId())
                                .caseNumber(m.getLegalCase().getCaseNumber())
                                .caseTitle(m.getLegalCase().getTitle())
                                .caseStatus(m.getLegalCase().getStatus().name())
                                .citizenName(m.getLegalCase().getCitizen().getFirstName())
                                .location(m.getLegalCase().getLocation().getCity())
                                .urgency(m.getLegalCase().getUrgency() != null ? m.getLegalCase().getUrgency().name()
                                                : "N/A")
                                .requestedAt(m.getCreatedAt())
                                .matchStatus("SUGGESTED")
                                .description(m.getLegalCase().getDescription())
                                .category(m.getLegalCase().getCategory() != null ? m.getLegalCase().getCategory()
                                                : "Uncategorized")
                                .fileUrl(safeGetDocumentUrl(m.getLegalCase()))
                                .build();
        }

        private ConsultationLeadDTO mapConsultationToDTO(Consultation c) {
                // Map consultation status to a frontend-friendly string
                String statusForFrontend;
                switch (c.getStatus()) {
                        case PENDING:
                                statusForFrontend = "CONTACTED"; // Pending = Awaiting response
                                break;
                        case ACCEPTED:
                                statusForFrontend = "ACCEPTED";
                                break;
                        case REJECTED:
                                statusForFrontend = "REJECTED";
                                break;
                        default:
                                statusForFrontend = "CONTACTED";
                }

                return ConsultationLeadDTO.builder()
                                .caseId(c.getLegalCase().getId())
                                .caseNumber(c.getLegalCase().getCaseNumber())
                                .caseTitle(c.getLegalCase().getTitle())
                                .caseStatus(c.getLegalCase().getStatus().name())
                                .citizenName(c.getLegalCase().getCitizen().getFirstName())
                                .location(c.getLegalCase().getLocation().getCity())
                                .urgency(c.getLegalCase().getUrgency() != null ? c.getLegalCase().getUrgency().name()
                                                : "N/A")
                                .requestedAt(c.getCreatedAt())
                                .matchStatus(statusForFrontend)
                                .description(c.getLegalCase().getDescription())
                                .category(c.getLegalCase().getCategory() != null ? c.getLegalCase().getCategory()
                                                : "Uncategorized")
                                .fileUrl(safeGetDocumentUrl(c.getLegalCase()))
                                .build();
        }

        private String safeGetDocumentUrl(LegalCase legalCase) {
                if (legalCase.getDocuments() != null && !legalCase.getDocuments().isEmpty()) {
                        CaseDocument doc = legalCase.getDocuments().get(0);
                        if (doc.getS3Key() != null && !doc.getS3Key().isEmpty()) {
                                try {
                                        String signedUrl = cloudflareR2Service.generatePresignedUrl(doc.getS3Key());
                                        if (signedUrl != null)
                                                return signedUrl;
                                } catch (Exception e) {
                                        // Fallback to stored URL
                                }
                        }
                        return doc.getFileUrl();
                }
                return null;
        }
}
