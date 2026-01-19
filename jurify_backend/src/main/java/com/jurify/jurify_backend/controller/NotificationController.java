package com.jurify.jurify_backend.controller;

import com.jurify.jurify_backend.model.Notification;
import com.jurify.jurify_backend.service.NotificationService;
import com.jurify.jurify_backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final JwtUtil jwtUtil;

    /**
     * Get notifications for current user
     */
    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(
            @RequestHeader("Authorization") String token,
            @RequestParam(required = false, defaultValue = "all") String filter) {

        Long userId = extractUserIdFromToken(token);
        List<Notification> notifications = notificationService.getNotifications(userId, filter);
        return ResponseEntity.ok(notifications);
    }

    /**
     * Get unread notification count
     */
    @GetMapping("/unread/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @RequestHeader("Authorization") String token) {

        Long userId = extractUserIdFromToken(token);
        Long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(Map.of("count", count));
    }

    /**
     * Mark notifications as read
     */
    @PutMapping("/read")
    public ResponseEntity<Void> markAsRead(
            @RequestHeader("Authorization") String token,
            @RequestBody Map<String, List<Long>> body) {

        Long userId = extractUserIdFromToken(token);
        List<Long> ids = body.get("ids");
        notificationService.markAsRead(userId, ids);
        return ResponseEntity.ok().build();
    }

    /**
     * Mark all notifications as read
     */
    @PutMapping("/read/all")
    public ResponseEntity<Void> markAllAsRead(
            @RequestHeader("Authorization") String token) {

        Long userId = extractUserIdFromToken(token);
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok().build();
    }

    /**
     * Delete notifications
     */
    @DeleteMapping
    public ResponseEntity<Void> deleteNotifications(
            @RequestHeader("Authorization") String token,
            @RequestBody Map<String, List<Long>> body) {

        Long userId = extractUserIdFromToken(token);
        List<Long> ids = body.get("ids");
        notificationService.deleteNotifications(userId, ids);
        return ResponseEntity.ok().build();
    }

    private Long extractUserIdFromToken(String token) {
        try {
            if (token == null || token.isEmpty()) {
                throw new RuntimeException("No authorization token provided");
            }
            String jwt = token.replace("Bearer ", "");
            Long userId = jwtUtil.extractUserId(jwt);
            if (userId == null) {
                throw new RuntimeException("Could not extract user ID from token");
            }
            return userId;
        } catch (Exception e) {
            throw new RuntimeException("Invalid token: " + e.getMessage(), e);
        }
    }
}
