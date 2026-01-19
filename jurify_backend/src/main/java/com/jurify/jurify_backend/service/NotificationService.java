package com.jurify.jurify_backend.service;

import com.jurify.jurify_backend.model.Notification;
import com.jurify.jurify_backend.repository.NotificationRepository;
import com.jurify.jurify_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;

    /**
     * Get notifications for a user, optionally filtered by read status
     * 
     * @param userId User ID
     * @param filter "all", "read", or "unread"
     * @return List of notifications
     */
    public List<Notification> getNotifications(Long userId, String filter) {
        if ("read".equalsIgnoreCase(filter)) {
            return notificationRepository.findByUserIdAndReadOrderByCreatedAtDesc(userId, true);
        } else if ("unread".equalsIgnoreCase(filter)) {
            return notificationRepository.findByUserIdAndReadOrderByCreatedAtDesc(userId, false);
        } else {
            return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        }
    }

    /**
     * Get count of unread notifications for a user
     */
    public Long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    /**
     * Mark specific notifications as read
     */
    @Transactional
    public void markAsRead(Long userId, List<Long> notificationIds) {
        List<Notification> notifications = notificationRepository.findAllById(notificationIds);
        LocalDateTime now = LocalDateTime.now();

        notifications.stream()
                .filter(n -> n.getUserId().equals(userId) && !n.getRead())
                .forEach(n -> {
                    n.setRead(true);
                    n.setReadAt(now);
                });

        notificationRepository.saveAll(notifications);
    }

    /**
     * Mark all notifications as read for a user
     */
    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> notifications = notificationRepository
                .findByUserIdAndReadOrderByCreatedAtDesc(userId, false);
        LocalDateTime now = LocalDateTime.now();

        notifications.forEach(n -> {
            n.setRead(true);
            n.setReadAt(now);
        });

        notificationRepository.saveAll(notifications);
    }

    /**
     * Delete specific notifications
     */
    @Transactional
    public void deleteNotifications(Long userId, List<Long> notificationIds) {
        notificationRepository.deleteByUserIdAndIdIn(userId, notificationIds);
    }

    /**
     * Create a new notification (for internal use by other services)
     */
    @Transactional
    public Notification createNotification(Notification notification) {
        log.info("Creating notification for user {}: {} - {}",
                notification.getUserId(), notification.getType(), notification.getTitle());
        Notification saved = notificationRepository.save(notification);

        // Push via WebSocket
        try {
            userRepository.findById(notification.getUserId()).ifPresent(user -> {
                log.info("Pushing notification to /user/{}/queue/notifications", user.getEmail());
                messagingTemplate.convertAndSendToUser(
                        user.getEmail(),
                        "/queue/notifications",
                        saved);
            });
        } catch (Exception e) {
            log.error("Failed to push notification via WebSocket: {}", e.getMessage());
        }

        return saved;
    }
}
