package com.jurify.jurify_backend.service;

import org.springframework.stereotype.Service;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PresenceService {
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;
    private final com.jurify.jurify_backend.repository.UserRepository userRepository;
    private final Set<String> onlineUsers = ConcurrentHashMap.newKeySet();

    public PresenceService(
            @org.springframework.context.annotation.Lazy org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate,
            com.jurify.jurify_backend.repository.UserRepository userRepository) {
        this.messagingTemplate = messagingTemplate;
        this.userRepository = userRepository;
    }

    public void markOnline(String email) {
        // Check availability logic
        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            var user = userOpt.get();
            if (user.getRole() == com.jurify.jurify_backend.model.enums.UserRole.LAWYER
                    && user.getLawyer() != null
                    && !user.getLawyer().getIsAvailable()) {
                // If lawyer is set to "Unavailable" in profile, DO NOT mark as online
                // Instead, ensure we broadcast them as offline/unavailable
                onlineUsers.remove(email);
                broadcastStatus(email, "offline", false);
                return;
            }
        }

        if (onlineUsers.add(email)) {
            broadcastStatus(email, "online", true);
        }
    }

    public void markOffline(String email) {
        if (onlineUsers.remove(email)) {
            // Fetch actual availability status from DB to avoid overwriting business status
            // with connection status
            boolean isAvailable = false;
            var userOpt = userRepository.findByEmail(email);
            if (userOpt.isPresent()) {
                var user = userOpt.get();
                if (user.getRole() == com.jurify.jurify_backend.model.enums.UserRole.LAWYER
                        && user.getLawyer() != null) {
                    isAvailable = user.getLawyer().getIsAvailable();
                } else if (user.getRole() == com.jurify.jurify_backend.model.enums.UserRole.NGO
                        && user.getNgo() != null) {
                    isAvailable = user.getNgo().getIsActive(); // Assuming NGO uses isActive similar to Lawyer
                } else {
                    isAvailable = true; // Citizens are always "available" conceptually
                }
            }
            broadcastStatus(email, "offline", isAvailable);
        }
    }

    public boolean isOnline(String email) {
        // Double check availability key? No, map only holds truly online users.
        return onlineUsers.contains(email);
    }

    public void broadcastStatus(String email, String status, boolean isAvailable) {
        if (messagingTemplate != null) {
            messagingTemplate.convertAndSend("/topic/presence",
                    (Object) java.util.Map.of(
                            "email", email,
                            "status", status,
                            "isAvailable", isAvailable));
        }
    }
}
