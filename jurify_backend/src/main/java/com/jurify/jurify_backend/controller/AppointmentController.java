package com.jurify.jurify_backend.controller;

import com.jurify.jurify_backend.model.Appointment;
import com.jurify.jurify_backend.dto.AppointmentDTO;
import com.jurify.jurify_backend.model.User;
import com.jurify.jurify_backend.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@lombok.extern.slf4j.Slf4j
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final com.jurify.jurify_backend.util.JwtUtil jwtUtil;

    // --- CALENDAR AUTH FLOW ---

    // 1. Redirect Info (Initiate)
    // 1. Redirect Info (Initiate)
    @GetMapping("/calendar/connect")
    public ResponseEntity<?> connectCalendar(Principal principal, @RequestParam(required = false) String redirectUri) {
        if (principal == null)
            return ResponseEntity.status(401).build();

        // Use provided redirectUri if available, otherwise default (though backend
        // callback is fixed)
        // ideally we pass this to the service to construct the state or use it after
        // callback
        String backendCallbackUrl = "http://localhost:8080/api/calendar/callback";

        String authUrl = appointmentService.connectGoogleCalendar(principal.getName(), backendCallbackUrl);
        return ResponseEntity.ok(Map.of("url", authUrl));
    }

    // 2. Callback from Google
    @GetMapping("/calendar/callback")
    public RedirectView handleCallback(@RequestParam String code, @RequestParam String state) {
        // 'state' contains the userEmail we passed in connectCalendar
        log.info("[GCAL] ========== CALLBACK RECEIVED: code={}, state={} ==========", (code != null ? "YES" : "NO"),
                state);
        try {
            String backendCallbackUrl = "http://localhost:8080/api/calendar/callback";
            appointmentService.saveGoogleToken(state, code, backendCallbackUrl);
            log.info("[GCAL] ========== CALLBACK SUCCESS: Token saved for {} ==========", state);

            // Get user to determine correct dashboard
            User user = appointmentService.getUserByEmail(state);
            String role = user.getRole().name().toLowerCase();
            String dashboardUrl = String.format("http://localhost:5173/%s/dashboard?tab=schedule&oauth_success=true",
                    role);

            log.info("[GCAL] Redirecting to: {}", dashboardUrl);
            return new RedirectView(dashboardUrl);
        } catch (Exception e) {
            log.error("[GCAL] ========== CALLBACK ERROR for {}: {} ==========", state, e.getMessage(), e);
            return new RedirectView("http://localhost:5173/?oauth_error=true");
        }
    }

    // 3. Status Check
    @GetMapping("/calendar/status")
    public ResponseEntity<?> getCalendarStatus(Principal principal) {
        if (principal == null)
            return ResponseEntity.status(401).body(Map.of("connected", false));
        boolean connected = appointmentService.isGoogleConnected(principal.getName());
        return ResponseEntity.ok(Map.of("connected", connected));
    }

    // Legacy sync (can keep or remove, keeping for safety but unused)
    @PostMapping("/calendar/sync")
    public ResponseEntity<?> syncCalendar(@RequestBody Map<String, String> payload, Principal principal) {
        String code = payload.get("code");
        String redirectUri = payload.get("redirectUri");
        appointmentService.saveGoogleToken(principal.getName(), code, redirectUri);
        return ResponseEntity.ok(Map.of("message", "Calendar connected successfully"));
    }

    // --- APPOINTMENT ENDPOINTS ---

    @PostMapping("/appointments/request")
    public ResponseEntity<Appointment> requestAppointment(@RequestBody Appointment appointment, Principal principal) {
        // Pass initiator email safely
        String initiatorEmail = (principal != null) ? principal.getName() : null;
        return ResponseEntity.ok(appointmentService.requestAppointment(appointment, initiatorEmail));
    }

    @GetMapping("/appointments/slots")
    public ResponseEntity<List<String>> getBusySlots(
            @RequestParam Long providerId,
            @RequestParam(required = false) Long requesterId,
            @RequestParam String date) {
        return ResponseEntity.ok(appointmentService.getBusySlots(providerId, requesterId, date));
    }

    @GetMapping("/appointments/provider/{providerId}")
    public ResponseEntity<List<Appointment>> getProviderAppointments(
            @PathVariable Long providerId,
            @RequestHeader("Authorization") String token) {

        // Extract user info from JWT token
        String jwt = token.replace("Bearer ", "");
        Long currentUserId = jwtUtil.extractUserId(jwt);
        String userRole = jwtUtil.extractRole(jwt);

        // If user is CITIZEN, only show their own appointments
        if ("CITIZEN".equals(userRole)) {
            return ResponseEntity.ok(
                    appointmentService.getAppointmentsForProviderAndRequester(providerId, currentUserId));
        }

        // For LAWYER, NGO, ADMIN - show all appointments for the provider
        return ResponseEntity.ok(appointmentService.getAppointmentsForProvider(providerId));
    }

    /**
     * Get upcoming confirmed appointments for current user
     */
    @GetMapping("/appointments/upcoming")
    public ResponseEntity<List<AppointmentDTO>> getUpcomingAppointments(
            @RequestHeader("Authorization") String token) {

        String jwt = token.replace("Bearer ", "");
        Long userId = jwtUtil.extractUserId(jwt);
        String userRole = jwtUtil.extractRole(jwt);

        List<AppointmentDTO> appointments = appointmentService.getUpcomingAppointments(userId, userRole);
        return ResponseEntity.ok(appointments);
    }

    @PostMapping("/appointments/{id}/status")
    public ResponseEntity<Appointment> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String statusStr = payload.get("status");
        return ResponseEntity.ok(appointmentService.updateStatus(id,
                com.jurify.jurify_backend.model.enums.AppointmentStatus.valueOf(statusStr)));
    }
}
