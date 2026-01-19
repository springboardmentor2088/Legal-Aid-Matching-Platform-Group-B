package com.jurify.jurify_backend.service;

import com.google.api.client.auth.oauth2.BearerToken;
import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.auth.oauth2.TokenResponse;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.googleapis.json.GoogleJsonResponseException;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.CalendarScopes;
import com.google.api.services.calendar.model.*;
import com.jurify.jurify_backend.model.Appointment;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class GoogleCalendarService {

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String clientId;

    @Value("${spring.security.oauth2.client.registration.google.client-secret}")
    private String clientSecret;

    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();
    private static final String CALENDAR_ID = "primary";

    // Build the flow manually for independent calendar linking
    private GoogleAuthorizationCodeFlow getFlow() throws IOException, GeneralSecurityException {
        final NetHttpTransport HTTP_TRANSPORT = GoogleNetHttpTransport.newTrustedTransport();

        GoogleClientSecrets.Details web = new GoogleClientSecrets.Details();
        web.setClientId(clientId);
        web.setClientSecret(clientSecret);
        GoogleClientSecrets secrets = new GoogleClientSecrets().setWeb(web);

        return new GoogleAuthorizationCodeFlow.Builder(
                HTTP_TRANSPORT, JSON_FACTORY, secrets, Collections.singleton(CalendarScopes.CALENDAR))
                .setAccessType("offline") // Vital for refresh token
                .setApprovalPrompt("auto") // Changed from 'force' to avoid re-prompting on every auth
                .build();
    }

    public String getAuthorizationUrl(String redirectUri, String state) throws IOException, GeneralSecurityException {
        return getFlow().newAuthorizationUrl()
                .setRedirectUri(redirectUri)
                .setState(state) // Pass user email/ID here
                .build();
    }

    public TokenResponse exchangeCodeForToken(String code, String redirectUri)
            throws IOException, GeneralSecurityException {
        try {
            log.info("[GCAL] Exchanging authorization code for token...");
            TokenResponse response = getFlow().newTokenRequest(code).setRedirectUri(redirectUri).execute();
            log.info("[GCAL] Token exchange successful. Access token received: {}, Refresh token received: {}",
                    response.getAccessToken() != null ? "YES" : "NO",
                    response.getRefreshToken() != null ? "YES" : "NO");
            return response;
        } catch (GoogleJsonResponseException e) {
            log.error("[GCAL] Google API error during token exchange: {}", e.getStatusCode());
            throw new RuntimeException("Failed to exchange authorization code: "
                    + (e.getDetails() != null ? e.getDetails().getMessage() : e.getMessage()), e);
        }
    }

    public TokenResponse refreshToken(String refreshToken) throws IOException, GeneralSecurityException {
        try {
            log.info("Refreshing access token...");
            final NetHttpTransport HTTP_TRANSPORT = GoogleNetHttpTransport.newTrustedTransport();

            java.util.Map<String, String> params = new java.util.HashMap<>();
            params.put("client_id", clientId);
            params.put("client_secret", clientSecret);
            params.put("refresh_token", refreshToken);
            params.put("grant_type", "refresh_token");

            com.google.api.client.http.HttpRequest request = HTTP_TRANSPORT.createRequestFactory()
                    .buildPostRequest(
                            new com.google.api.client.http.GenericUrl("https://oauth2.googleapis.com/token"),
                            new com.google.api.client.http.UrlEncodedContent(params));

            TokenResponse response = request.execute().parseAs(TokenResponse.class);
            log.info("Token refresh successful");
            return response;
        } catch (Exception e) {
            log.error("Failed to refresh token: {}", e.getMessage(), e);
            throw new RuntimeException("Token refresh failed", e);
        }
    }

    private Calendar getCalendarClient(String accessToken) throws GeneralSecurityException, IOException {
        if (accessToken == null || accessToken.trim().isEmpty()) {
            throw new IllegalArgumentException("Access token is null or empty. Cannot create Calendar client.");
        }

        final NetHttpTransport HTTP_TRANSPORT = GoogleNetHttpTransport.newTrustedTransport();

        // Use non-deprecated Credential with BearerToken
        Credential credential = new Credential(BearerToken.authorizationHeaderAccessMethod())
                .setAccessToken(accessToken);

        return new Calendar.Builder(HTTP_TRANSPORT, JSON_FACTORY, credential)
                .setApplicationName("Jurify")
                .build();
    }

    public Event createEvent(String accessToken, Appointment appointment, String attendeeEmail)
            throws IOException, GeneralSecurityException {
        try {
            Calendar service = getCalendarClient(accessToken);

            Event event = new Event()
                    .setSummary("Legal Consultation via Jurify")
                    .setDescription(appointment.getNotes() != null ? appointment.getNotes() : "Scheduled Consultation");

            // Convert LocalTime/Date to DateTime
            LocalDateTime startDateTime = LocalDateTime.of(appointment.getDate(), appointment.getTime());
            LocalDateTime endDateTime = startDateTime.plusHours(1); // Default 1 hour duration

            DateTime start = new DateTime(Date.from(startDateTime.atZone(ZoneId.systemDefault()).toInstant()));
            EventDateTime startEventDateTime = new EventDateTime().setDateTime(start)
                    .setTimeZone(ZoneId.systemDefault().getId());
            event.setStart(startEventDateTime);

            DateTime end = new DateTime(Date.from(endDateTime.atZone(ZoneId.systemDefault()).toInstant()));
            EventDateTime endEventDateTime = new EventDateTime().setDateTime(end)
                    .setTimeZone(ZoneId.systemDefault().getId());
            event.setEnd(endEventDateTime);

            // Add Attendees
            if (attendeeEmail != null && !attendeeEmail.isEmpty()) {
                EventAttendee attendee = new EventAttendee();
                attendee.setEmail(attendeeEmail);
                event.setAttendees(Collections.singletonList(attendee));
            }

            // Add Google Meet
            ConferenceData conferenceData = new ConferenceData();
            CreateConferenceRequest createConferenceRequest = new CreateConferenceRequest();
            createConferenceRequest.setRequestId(UUID.randomUUID().toString());

            ConferenceSolutionKey conferenceSolutionKey = new ConferenceSolutionKey();
            conferenceSolutionKey.setType("hangoutsMeet");
            createConferenceRequest.setConferenceSolutionKey(conferenceSolutionKey);

            conferenceData.setCreateRequest(createConferenceRequest);
            event.setConferenceData(conferenceData);

            log.info("Creating calendar event for appointment {}", appointment.getId());
            Event createdEvent = service.events().insert(CALENDAR_ID, event)
                    .setConferenceDataVersion(1)
                    .setSendUpdates("all")
                    .execute();
            log.info("Calendar event created successfully: {}", createdEvent.getId());
            return createdEvent;
        } catch (GoogleJsonResponseException e) {
            log.error("Google API error creating event: {}", e.getStatusCode());
            throw new RuntimeException("Failed to create calendar event: "
                    + (e.getDetails() != null ? e.getDetails().getMessage() : e.getMessage()), e);
        }
    }

    public List<TimePeriod> getBusyPeriods(String accessToken, LocalDateTime start, LocalDateTime end)
            throws IOException, GeneralSecurityException {
        try {
            Calendar service = getCalendarClient(accessToken);

            // TODO: Replace systemDefault() with user's timezone from User entity
            ZoneId zone = ZoneId.systemDefault();

            FreeBusyRequest request = new FreeBusyRequest();
            request.setTimeMin(new DateTime(Date.from(start.atZone(zone).toInstant())));
            request.setTimeMax(new DateTime(Date.from(end.atZone(zone).toInstant())));
            request.setItems(Collections.singletonList(new FreeBusyRequestItem().setId("primary")));

            log.info("Querying Google Calendar freebusy from {} to {}", start, end);
            FreeBusyResponse response = service.freebusy().query(request).execute();

            // Null safety checks
            if (response.getCalendars() == null || response.getCalendars().get("primary") == null) {
                log.warn("No calendar data returned from Google");
                return Collections.emptyList();
            }

            List<TimePeriod> busyPeriods = response.getCalendars().get("primary").getBusy();
            log.info("Retrieved {} busy periods", busyPeriods != null ? busyPeriods.size() : 0);
            return busyPeriods != null ? busyPeriods : Collections.emptyList();
        } catch (GoogleJsonResponseException e) {
            log.error("Google API error querying busy periods: {}", e.getStatusCode());
            throw new RuntimeException("Failed to get busy periods: "
                    + (e.getDetails() != null ? e.getDetails().getMessage() : e.getMessage()), e);
        }
    }

    public List<Event> listUpcomingEvents(String accessToken) throws IOException, GeneralSecurityException {
        Calendar service = getCalendarClient(accessToken);
        DateTime now = new DateTime(System.currentTimeMillis());
        Events events = service.events().list(CALENDAR_ID)
                .setTimeMin(now)
                .setOrderBy("startTime")
                .setSingleEvents(true)
                .execute();
        return events.getItems();
    }
}
