package com.jurify.jurify_backend.service;

import com.jurify.jurify_backend.model.AuditLog;
import com.jurify.jurify_backend.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final com.jurify.jurify_backend.repository.UserRepository userRepository;

    /**
     * Log an admin action
     */
    @Transactional
    public void logAction(String action, Long adminId, Long targetUserId, String details, String ipAddress) {
        com.jurify.jurify_backend.model.User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        AuditLog log = AuditLog.builder()
                .action(action)
                .admin(admin)
                .targetUserId(targetUserId)
                .targetEntityType("USER")
                .targetEntityId(targetUserId)
                .details(details)
                .ipAddress(ipAddress)
                .build();
        auditLogRepository.save(log);
    }

    /**
     * Log an admin action on a specific entity
     */
    @Transactional
    public void logAction(String action, Long adminId, String entityType, Long entityId, String details,
            String ipAddress) {
        com.jurify.jurify_backend.model.User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        AuditLog log = AuditLog.builder()
                .action(action)
                .admin(admin)
                .targetEntityType(entityType)
                .targetEntityId(entityId)
                .details(details)
                .ipAddress(ipAddress)
                .build();
        auditLogRepository.save(log);
    }

    /**
     * Log a user-initiated system action (e.g., case submission, appointment
     * creation)
     * This method does not require admin privileges.
     */
    @Transactional
    public void logSystemAction(String action, Long userId, String entityType, Long entityId, String details) {
        com.jurify.jurify_backend.model.User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        AuditLog log = AuditLog.builder()
                .action(action)
                .admin(user) // Using admin field to store actor
                .targetEntityType(entityType)
                .targetEntityId(entityId)
                .details(details)
                .ipAddress("System")
                .build();
        auditLogRepository.save(log);
    }

    /**
     * Get all audit logs (paginated)
     */
    @Transactional(readOnly = true)
    public Page<AuditLog> getAllLogs(Pageable pageable) {
        return auditLogRepository.findAllWithAdmin(pageable);
    }

    public Page<com.jurify.jurify_backend.dto.admin.AdminAuditLogDTO> getAuditLogsDTO(Pageable pageable) {
        return auditLogRepository.findAllWithAdmin(pageable)
                .map(log -> {
                    String userEmail = log.getAdmin() != null ? log.getAdmin().getEmail() : "System";
                    String userRole = log.getAdmin() != null ? log.getAdmin().getRole().name() : "SYSTEM";

                    return com.jurify.jurify_backend.dto.admin.AdminAuditLogDTO.builder()
                            .id("LOG-" + log.getId())
                            .user(userEmail)
                            .role(userRole)
                            .action(log.getAction())
                            .module(log.getTargetEntityType())
                            .status("Success")
                            .time(log.getTimestamp().toString())
                            .ip(log.getIpAddress())
                            .device("Unknown")
                            .details(java.util.Collections.singletonMap("info", log.getDetails()))
                            .build();
                });
    }

    /**
     * Get audit logs by admin ID
     */
    @Transactional(readOnly = true)
    public Page<AuditLog> getLogsByAdmin(Long adminId, Pageable pageable) {
        return auditLogRepository.findByAdminId(adminId, pageable);
    }

    /**
     * Get audit logs by target user
     */
    @Transactional(readOnly = true)
    public Page<AuditLog> getLogsByTargetUser(Long targetUserId, Pageable pageable) {
        return auditLogRepository.findByTargetUserId(targetUserId, pageable);
    }
}
