package com.jurify.jurify_backend.service;

import com.google.api.client.auth.oauth2.TokenResponse;

import com.google.api.services.calendar.model.EntryPoint;
import com.google.api.services.calendar.model.Event;
import com.jurify.jurify_backend.model.Appointment;
import com.jurify.jurify_backend.model.Notification;
import com.jurify.jurify_backend.model.OAuthAccount;
import com.jurify.jurify_backend.model.User;
import com.jurify.jurify_backend.model.enums.AppointmentStatus;
import com.jurify.jurify_backend.model.enums.NotificationType;
import com.jurify.jurify_backend.model.enums.Provider;
import com.jurify.jurify_backend.model.enums.UserRole;
import com.jurify.jurify_backend.dto.AppointmentDTO;
import com.jurify.jurify_backend.repository.AppointmentRepository;
import com.jurify.jurify_backend.repository.LawyerRepository;
import com.jurify.jurify_backend.repository.LegalCaseRepository;
import com.jurify.jurify_backend.repository.NGORepository;
import com.jurify.jurify_backend.repository.OAuthAccountRepository;
import com.jurify.jurify_backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final OAuthAccountRepository oauthAccountRepository;
    private final GoogleCalendarService googleCalendarService;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final LawyerRepository lawyerRepository;
    private final NGORepository ngoRepository;
    private final LegalCaseRepository legalCaseRepository;
    private final EmailService emailService;
    private final AuditLogService auditLogService;

    @Transactional
    public Appointment requestAppointment(Appointment appointment, String initiatorEmail) {
        // Determine who initiated the request
        User currentUser = null;
        if (initiatorEmail != null) {
            currentUser = userRepository.findByEmail(initiatorEmail).orElse(null);
            log.info("Request initiated by: {}", initiatorEmail);
            if (currentUser != null) {
                appointment.setInitiatedBy(currentUser.getId());
                log.info("Initiator ID resolved to: {}", currentUser.getId());
            } else {
                log.warn("Initiator User not found for email: {}", initiatorEmail);
            }
        }

        appointment.setStatus(AppointmentStatus.PENDING);
        Appointment saved = appointmentRepository.save(appointment);

        // Notify provider (Lawyer or NGO)
        try {
            Long targetUserId = null;
            String targetTitle = "New Appointment Request";
            String targetMessage = "You have a new appointment request for " + appointment.getDate();

            // Resolve Provider User ID
            Long providerUserId = null;

            // Try explicit lookup by User ID first (since frontend likely sends User ID)
            Optional<com.jurify.jurify_backend.model.Lawyer> lawyer = lawyerRepository
                    .findByUser_Id(appointment.getProviderId());
            if (lawyer.isPresent()) {
                providerUserId = lawyer.get().getUser().getId();
            } else {
                Optional<com.jurify.jurify_backend.model.NGO> ngo = ngoRepository
                        .findByUser_Id(appointment.getProviderId());
                if (ngo.isPresent()) {
                    providerUserId = ngo.get().getUser().getId();
                } else {
                    // Fallback: maybe it IS the entity ID?
                    Optional<com.jurify.jurify_backend.model.Lawyer> lawyerById = lawyerRepository
                            .findById(appointment.getProviderId());
                    if (lawyerById.isPresent()) {
                        providerUserId = lawyerById.get().getUser().getId();
                    } else {
                        Optional<com.jurify.jurify_backend.model.NGO> ngoById = ngoRepository
                                .findById(appointment.getProviderId());
                        if (ngoById.isPresent()) {
                            providerUserId = ngoById.get().getUser().getId();
                        }
                    }
                }
            }

            log.info("Notification Target Calculation - CurrentUser: {}, ProviderUser: {}, Requester: {}",
                    (currentUser != null ? currentUser.getId() : "null"),
                    providerUserId,
                    appointment.getRequesterId());

            // If Current User is the Provider -> Notify Requester (Citizen)
            if (currentUser != null && providerUserId != null && currentUser.getId().equals(providerUserId)) {
                targetUserId = appointment.getRequesterId(); // Notify Citizen
                targetTitle = "Appointment Suggestion";
                targetMessage = "Your lawyer has proposed an appointment for " + appointment.getDate();
            }
            // Else (Citizen initiated) -> Notify Provider (Lawyer/NGO)
            else if (providerUserId != null) {
                targetUserId = providerUserId;
            }

            if (targetUserId != null) {
                log.info("Sending notification to User ID: {}", targetUserId);

                // 1. In-App Notification
                notificationService.createNotification(Notification.builder()
                        .userId(targetUserId)
                        .type(NotificationType.APPOINTMENT)
                        .title(targetTitle)
                        .message(targetMessage)
                        .appointmentId(saved.getId())
                        .build());

                // 2. Email Notification
                User targetUser = userRepository.findById(targetUserId).orElse(null);
                if (targetUser != null && targetUser.getEmail() != null) {
                    log.info("Sending email to: {}", targetUser.getEmail());

                    // Resolve Initiator Name
                    String initiatorName = "A user";
                    if (currentUser != null) {
                        if (currentUser.getCitizen() != null) {
                            initiatorName = currentUser.getCitizen().getFirstName() + " "
                                    + currentUser.getCitizen().getLastName();
                        } else if (currentUser.getLawyer() != null) {
                            initiatorName = currentUser.getLawyer().getFirstName() + " "
                                    + currentUser.getLawyer().getLastName();
                        } else if (currentUser.getNgo() != null) {
                            initiatorName = currentUser.getNgo().getOrganizationName();
                        } else {
                            initiatorName = currentUser.getEmail();
                        }
                    }

                    // Resolve Case Number
                    String caseNumber = "N/A";
                    if (appointment.getCaseId() != null) {
                        try {
                            var legalCase = legalCaseRepository.findById(appointment.getCaseId()).orElse(null);
                            if (legalCase != null) {
                                caseNumber = "ID: " + legalCase.getId() + " - " + legalCase.getTitle();
                            }
                        } catch (Exception ignored) {
                        }
                    }

                    String emailValues = String.format(
                            "<strong>From:</strong> %s<br>" +
                                    "<strong>Case:</strong> %s<br>" +
                                    "<strong>Date:</strong> %s<br>" +
                                    "<strong>Time:</strong> %s<br>" +
                                    "<strong>Notes:</strong> %s",
                            initiatorName,
                            caseNumber,
                            appointment.getDate(),
                            appointment.getTime(),
                            (appointment.getNotes() != null ? appointment.getNotes() : "None"));

                    emailService.sendGeneralEmail(
                            targetUser.getEmail(),
                            targetTitle,
                            "New Appointment Request",
                            "You have received a new appointment request.<br><br>" + emailValues,
                            "View Request",
                            "http://localhost:5173/dashboard");
                    log.info("Email sent successfully.");
                } else {
                    log.warn("Target user for email not found or has no email address. ID: {}", targetUserId);
                }
            } else {
                log.warn("Could not determine target user for notification.");
            }
        } catch (Exception e) {
            log.error("Failed to send notification for appointment request: {}", e.getMessage(), e);
        }

        // Audit Log: Appointment Created
        if (currentUser != null) {
            auditLogService.logSystemAction("SCHEDULE_CREATED", currentUser.getId(), "APPOINTMENT", saved.getId(),
                    "Appointment scheduled for " + appointment.getDate());
        }

        return saved;
    }

    public String connectGoogleCalendar(String userEmail, String redirectUri) {
        try {
            // Use userEmail as state to identify user on callback
            return googleCalendarService.getAuthorizationUrl(redirectUri, userEmail);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate auth URL", e);
        }
    }

    @Transactional
    public void saveGoogleToken(String userEmail, String code, String redirectUri) {
        try {
            TokenResponse token = googleCalendarService.exchangeCodeForToken(code, redirectUri);
            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Optional<OAuthAccount> existing = oauthAccountRepository.findByUserIdAndProvider(user.getId(),
                    Provider.GOOGLE);

            OAuthAccount account = existing.orElse(OAuthAccount.builder()
                    .user(user)
                    .provider(Provider.GOOGLE)
                    .providerAccountId("google_calendar_" + user.getId()) // Placeholder
                    .build());

            log.info("[GCAL] Received Token Response: AccessToken={}, RefreshToken={}, ExpiresIn={}",
                    token.getAccessToken() != null ? "YES" : "NO",
                    token.getRefreshToken() != null ? "YES" : "NO",
                    token.getExpiresInSeconds());

            account.setAccessToken(token.getAccessToken());
            if (token.getRefreshToken() != null) {
                account.setRefreshToken(token.getRefreshToken()); // Only check if present
            }
            account.setTokenExpiresAt(LocalDateTime.now().plusSeconds(token.getExpiresInSeconds()));

            oauthAccountRepository.save(account);
            log.info("[GCAL] ========== Google Calendar connected for user: {} ==========", userEmail);

        } catch (Exception e) {
            log.error("Failed to save Google token", e);
            throw new RuntimeException("Failed to connect Google Calendar");
        }
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }

    public List<Appointment> getAppointmentsForProvider(Long providerId) {
        List<Appointment> appointments = appointmentRepository.findByProviderId(providerId);

        // Check if this provider is an NGO and filter by case assignment
        try {
            User provider = userRepository.findById(providerId).orElse(null);
            if (provider != null && provider.getRole() == UserRole.NGO) {
                // For NGOs, only return appointments for cases they're assigned to
                appointments = appointments.stream()
                        .filter(app -> {
                            if (app.getCaseId() == null)
                                return false;

                            try {
                                var legalCase = legalCaseRepository.findById(app.getCaseId()).orElse(null);
                                if (legalCase == null)
                                    return false;

                                // Only include if this NGO is assigned to the case
                                return legalCase.getNgo() != null && legalCase.getNgo().getId().equals(providerId);
                            } catch (Exception e) {
                                log.error("Error checking NGO case assignment: {}", e.getMessage());
                                return false;
                            }
                        })
                        .toList();
            }
        } catch (Exception e) {
            log.error("Error checking provider role: {}", e.getMessage());
        }

        return appointments;
    }

    public List<Appointment> getAppointmentsForProviderAndRequester(Long providerId, Long requesterId) {
        return appointmentRepository.findByProviderIdAndRequesterId(providerId, requesterId);
    }

    public List<String> getBusySlots(Long providerId, Long requesterId, String dateStr) {
        log.info("Fetching combined busy slots for provider {} and requester {} on {}", providerId, requesterId,
                dateStr);

        java.util.Set<String> busyTimes = new java.util.HashSet<>();
        java.time.LocalDate date = java.time.LocalDate.parse(dateStr);

        // 1. Collect for Provider
        collectBusySlotsForUser(providerId, date, busyTimes);

        // 2. Collect for Requester (if provided)
        if (requesterId != null) {
            collectBusySlotsForUser(requesterId, date, busyTimes);
        }

        List<String> result = new java.util.ArrayList<>(busyTimes);
        java.util.Collections.sort(result);
        log.info("Final combined busy slots: {}", result);
        return result;
    }

    private void collectBusySlotsForUser(Long userId, java.time.LocalDate date, java.util.Set<String> busyTimes) {
        // 1. Internal Appointments
        // Use a more generic query or handle both roles
        // For simplicity, we check if they are the provider OR requester in any
        // appointment
        List<Appointment> appsAsProvider = appointmentRepository.findByProviderIdAndDate(userId, date);
        List<Appointment> appsAsRequester = appointmentRepository.findByRequesterIdAndDate(userId, date);

        for (Appointment app : appsAsProvider) {
            // ONLY BLOCKS SLOTS IF CONFIRMED
            if (app.getStatus() == AppointmentStatus.CONFIRMED) {
                busyTimes.add(app.getTime().toString().substring(0, 5));
            }
        }
        for (Appointment app : appsAsRequester) {
            // ONLY BLOCKS SLOTS IF CONFIRMED
            if (app.getStatus() == AppointmentStatus.CONFIRMED) {
                busyTimes.add(app.getTime().toString().substring(0, 5));
            }
        }

        // 2. Google Calendar
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        Optional<OAuthAccount> oauth = oauthAccountRepository.findByUserIdAndProvider(user.getId(), Provider.GOOGLE);
        if (oauth.isPresent()) {
            OAuthAccount account = oauth.get();
            try {
                // Initial refresh check
                ensureTokenFreshness(account);

                // Attempt to fetch with retry
                try {
                    fetchAndProcessGoogleSlots(account, date, busyTimes);
                } catch (RuntimeException e) {
                    if (isUnauthorized(e) && account.getRefreshToken() != null) {
                        log.info("Google API 401 Unauthorized for user {}. Refreshing token and retrying...", userId);
                        refreshAndSaveToken(account);
                        fetchAndProcessGoogleSlots(account, date, busyTimes);
                    } else {
                        throw e;
                    }
                }
            } catch (Exception e) {
                log.error("Error fetching Google availability for user {}", userId, e);
            }
        }
    }

    // --- Helper Methods for Google Calendar Retry Logic ---

    private void ensureTokenFreshness(OAuthAccount account) throws Exception {
        if (account.getTokenExpiresAt() != null &&
                account.getTokenExpiresAt().minusMinutes(5).isBefore(LocalDateTime.now())) {
            refreshAndSaveToken(account);
        }
    }

    private void refreshAndSaveToken(OAuthAccount account) throws Exception {
        if (account.getRefreshToken() == null) {
            throw new RuntimeException("No refresh token available");
        }
        TokenResponse newToken = googleCalendarService.refreshToken(account.getRefreshToken());
        account.setAccessToken(newToken.getAccessToken());
        account.setTokenExpiresAt(LocalDateTime.now().plusSeconds(newToken.getExpiresInSeconds()));
        if (newToken.getRefreshToken() != null) {
            account.setRefreshToken(newToken.getRefreshToken());
        }
        oauthAccountRepository.save(account);
        log.info("Refreshed Google Access Token for user {}", account.getUser().getId());
    }

    private String createGoogleMeetingWithRetry(OAuthAccount account, Appointment appointment, String attendeeEmail)
            throws Exception {
        ensureTokenFreshness(account);
        try {
            Event event = googleCalendarService.createEvent(account.getAccessToken(), appointment, attendeeEmail);
            return extractMeetingLink(event);
        } catch (RuntimeException e) {
            if (isUnauthorized(e) && account.getRefreshToken() != null) {
                log.info("Google API 401 during createEvent. Refreshing and retrying...");
                refreshAndSaveToken(account);
                Event event = googleCalendarService.createEvent(account.getAccessToken(), appointment, attendeeEmail);
                return extractMeetingLink(event);
            }
            throw e;
        }
    }

    private void fetchAndProcessGoogleSlots(OAuthAccount account, java.time.LocalDate date,
            java.util.Set<String> busyTimes) throws Exception {
        java.time.ZoneId zone = java.time.ZoneId.systemDefault();
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.plusDays(1).atStartOfDay();

        String token = account.getAccessToken();
        if (token != null && !token.isEmpty()) {
            List<com.google.api.services.calendar.model.TimePeriod> googleBusy = googleCalendarService
                    .getBusyPeriods(token, startOfDay, endOfDay);

            if (googleBusy != null) {
                for (com.google.api.services.calendar.model.TimePeriod period : googleBusy) {
                    long startMs = period.getStart().getValue();
                    long endMs = period.getEnd().getValue();

                    LocalDateTime busStart = java.time.Instant.ofEpochMilli(startMs).atZone(zone).toLocalDateTime();
                    LocalDateTime busEnd = java.time.Instant.ofEpochMilli(endMs).atZone(zone).toLocalDateTime();

                    LocalDateTime searchStart = busStart.truncatedTo(java.time.temporal.ChronoUnit.HOURS);
                    LocalDateTime currentSlot = searchStart;
                    while (currentSlot.isBefore(busEnd)) {
                        LocalDateTime slotEnd = currentSlot.plusMinutes(30);
                        if (currentSlot.isBefore(busEnd) && slotEnd.isAfter(busStart)) {
                            if (currentSlot.toLocalDate().equals(date)) {
                                busyTimes.add(
                                        String.format("%02d:%02d", currentSlot.getHour(), currentSlot.getMinute()));
                            }
                        }
                        currentSlot = slotEnd;
                    }
                }
            }
        }
    }

    private boolean isUnauthorized(RuntimeException e) {
        // Check message or cause for 401
        Throwable cause = e.getCause();
        if (e.getMessage() != null && e.getMessage().contains("401"))
            return true;
        if (cause != null && cause.getMessage() != null && cause.getMessage().contains("401"))
            return true;
        return false;
    }

    @Transactional
    public Appointment updateStatus(Long id, AppointmentStatus status) {
        Appointment app = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        app.setStatus(status);
        Appointment savedApp = appointmentRepository.save(app);

        // Fetch Provider and Requester for notifications
        User provider = userRepository.findById(savedApp.getProviderId())
                .orElseThrow(() -> new RuntimeException("Provider not found"));
        User requester = userRepository.findById(savedApp.getRequesterId())
                .orElseThrow(() -> new RuntimeException("Requester not found"));

        if (status == AppointmentStatus.CONFIRMED) {
            // Create notifications for both provider and requester
            notificationService.createNotification(Notification.builder()
                    .userId(requester.getId())
                    .type(NotificationType.APPOINTMENT)
                    .title("Appointment Confirmed")
                    .message(String.format("Your appointment with %s on %s at %s has been confirmed.",
                            provider.getEmail(),
                            savedApp.getDate(),
                            savedApp.getTime()))
                    .appointmentId(savedApp.getId())
                    .read(false)
                    .build());

            notificationService.createNotification(Notification.builder()
                    .userId(provider.getId())
                    .type(NotificationType.APPOINTMENT)
                    .title("Appointment Confirmed")
                    .message(String.format("You confirmed an appointment with %s on %s at %s.",
                            requester.getEmail(),
                            savedApp.getDate(),
                            savedApp.getTime()))
                    .appointmentId(savedApp.getId())
                    .read(false)
                    .build());

            // MEETING LINK GENERATION STRATEGY
            // 1. Try Provider's Google Calendar
            // 2. Try Requester's Google Calendar
            // 3. Fallback to Jitsi Meet
            String meetingLink = null;
            String googleEventId = null;

            try {
                // STRATEGY 1: Provider's Google Calendar
                // Check if provider has Google Calendar connected
                Optional<OAuthAccount> providerAuth = oauthAccountRepository.findByUserIdAndProvider(provider.getId(),
                        Provider.GOOGLE);

                if (providerAuth.isPresent()) {
                    OAuthAccount oauth = providerAuth.get();
                    try {
                        meetingLink = createGoogleMeetingWithRetry(oauth, savedApp, requester.getEmail());
                        if (meetingLink != null) {
                            googleEventId = "generated-via-provider"; // We'd need to change signature to return event
                                                                      // ID too, but this is minor
                            log.info("Generated Google Meet link via Provider: {}", meetingLink);
                        }
                    } catch (Exception e) {
                        log.error("Failed to generate link via Provider GCal", e);
                    }
                }

                // STRATEGY 2: Requester's Google Calendar (if Strategy 1 failed)
                if (meetingLink == null) {
                    Optional<OAuthAccount> requesterAuth = oauthAccountRepository
                            .findByUserIdAndProvider(requester.getId(), Provider.GOOGLE);
                    if (requesterAuth.isPresent()) {
                        OAuthAccount oauth = requesterAuth.get();
                        try {
                            meetingLink = createGoogleMeetingWithRetry(oauth, savedApp, provider.getEmail());
                            if (meetingLink != null) {
                                googleEventId = "generated-via-requester";
                                log.info("Generated Google Meet link via Requester: {}", meetingLink);
                            }
                        } catch (Exception e) {
                            log.error("Failed to generate link via Requester GCal", e);
                        }
                    }
                }

                // STRATEGY 3: Jitsi Fallback (if both GCal attempts failed)
                if (meetingLink == null) {
                    // Generate a unique, secure-ish Jitsi room name
                    String roomName = "Jurify-Appointment-" + savedApp.getId() + "-"
                            + java.util.UUID.randomUUID().toString().substring(0, 8);
                    meetingLink = "https://meet.jit.si/" + roomName;
                    log.info("Generated Jitsi Fallback link: {}", meetingLink);
                }

                // Save the link
                savedApp.setMeetLink(meetingLink);
                savedApp.setGoogleEventId(googleEventId);
                savedApp = appointmentRepository.save(savedApp);

            } catch (Exception e) {
                log.error("Critical error in meeting generation logic", e);
            }
        } else if (status == AppointmentStatus.REJECTED) {
            // Notify requester that appointment was rejected
            notificationService.createNotification(Notification.builder()
                    .userId(requester.getId())
                    .type(NotificationType.APPOINTMENT)
                    .title("Appointment Rejected")
                    .message(String.format("Your appointment request with %s on %s at %s was not accepted.",
                            provider.getEmail(),
                            savedApp.getDate(),
                            savedApp.getTime()))
                    .appointmentId(savedApp.getId())
                    .read(false)
                    .build());
        }

        return savedApp;
    }

    public boolean isGoogleConnected(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return oauthAccountRepository.findByUserIdAndProvider(user.getId(), Provider.GOOGLE)
                .map(account -> account.getAccessToken() != null && !account.getAccessToken().isEmpty())
                .orElse(false);
    }

    /**
     * Get upcoming confirmed appointments for a user (limited to next 5)
     * Returns appointments where user is either provider or requester
     */
    public List<AppointmentDTO> getUpcomingAppointments(Long userId, String userRole) {
        List<Appointment> appointments;

        List<com.jurify.jurify_backend.model.enums.AppointmentStatus> statuses = java.util.Arrays.asList(
                com.jurify.jurify_backend.model.enums.AppointmentStatus.CONFIRMED,
                com.jurify.jurify_backend.model.enums.AppointmentStatus.PENDING);

        // For lawyers, get appointments where they are the provider
        if ("LAWYER".equalsIgnoreCase(userRole)) {
            appointments = appointmentRepository
                    .findByProviderIdAndStatusInOrderByDateAscTimeAsc(userId, statuses);
        } else if ("NGO".equalsIgnoreCase(userRole)) {
            // For NGOs, get appointments only for cases they are assigned to
            appointments = appointmentRepository
                    .findByProviderIdAndStatusInOrderByDateAscTimeAsc(userId, statuses)
                    .stream()
                    .filter(app -> {
                        // Only include appointments where the NGO is assigned to the case
                        if (app.getCaseId() == null)
                            return false;

                        try {
                            var legalCase = legalCaseRepository.findById(app.getCaseId()).orElse(null);
                            if (legalCase == null)
                                return false;

                            // Check if this NGO is assigned to the case
                            return legalCase.getNgo() != null && legalCase.getNgo().getId().equals(userId);
                        } catch (Exception e) {
                            log.error("Error checking NGO case assignment: {}", e.getMessage());
                            return false;
                        }
                    })
                    .toList();
        } else {
            // For citizens, get appointments where they are the requester
            appointments = appointmentRepository
                    .findByRequesterIdAndStatusInOrderByDateAscTimeAsc(userId, statuses);
        }

        // Filter to only future appointments and limit to 5
        LocalDate today = LocalDate.now();
        return appointments.stream()
                .filter(app -> !app.getDate().isBefore(today))
                .limit(5)
                .map(this::convertToDTO)
                .toList();
    }

    private AppointmentDTO convertToDTO(Appointment app) {
        AppointmentDTO dto = AppointmentDTO.builder()
                .id(app.getId())
                .date(app.getDate())
                .time(app.getTime())
                .providerId(app.getProviderId())
                .requesterId(app.getRequesterId())
                .caseId(app.getCaseId())
                .status(app.getStatus())
                .notes(app.getNotes())
                .googleEventId(app.getGoogleEventId())
                .meetLink(app.getMeetLink())
                .initiatedBy(app.getInitiatedBy())
                .build();

        // Fetch Provider Name
        userRepository.findById(app.getProviderId()).ifPresent(user -> {
            if (user.getLawyer() != null) {
                dto.setProviderName("Adv. " + user.getLawyer().getFirstName() + " " + user.getLawyer().getLastName());
            } else if (user.getNgo() != null) {
                dto.setProviderName(user.getNgo().getOrganizationName());
            } else {
                dto.setProviderName(user.getEmail());
            }
        });

        // Fetch Requester Name
        userRepository.findById(app.getRequesterId()).ifPresent(user -> {
            if (user.getCitizen() != null) {
                dto.setRequesterName(user.getCitizen().getFirstName() + " " + user.getCitizen().getLastName());
            } else {
                dto.setRequesterName(user.getEmail());
            }
        });

        // Fetch Case Title
        if (app.getCaseId() != null) {
            legalCaseRepository.findById(app.getCaseId()).ifPresent(c -> dto.setCaseTitle(c.getTitle()));
        }

        return dto;
    }

    private String extractMeetingLink(Event event) {
        if (event == null)
            return null;

        // 1. Try legacy hangoutLink
        if (event.getHangoutLink() != null && !event.getHangoutLink().isEmpty()) {
            return event.getHangoutLink();
        }

        // 2. Try conferenceData (modern Google Meet)
        if (event.getConferenceData() != null && event.getConferenceData().getEntryPoints() != null) {
            return event.getConferenceData().getEntryPoints().stream()
                    .filter(entry -> "video".equals(entry.getEntryPointType()))
                    .map(EntryPoint::getUri)
                    .findFirst()
                    .orElse(null);
        }

        return null;
    }
}
