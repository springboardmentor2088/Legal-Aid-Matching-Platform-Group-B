package com.jurify.jurify_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs", indexes = {
        @Index(name = "idx_audit_admin", columnList = "admin_id"),
        @Index(name = "idx_audit_target", columnList = "target_user_id"),
        @Index(name = "idx_audit_action", columnList = "action"),
        @Index(name = "idx_audit_timestamp", columnList = "timestamp")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String action; // e.g., USER_SUSPENDED, USER_VERIFIED, CASE_REASSIGNED

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id", nullable = false)
    private User admin;

    @Column(name = "target_user_id")
    private Long targetUserId;

    @Column(name = "target_entity_type", length = 50)
    private String targetEntityType; // USER, CASE, VERIFICATION

    @Column(name = "target_entity_id")
    private Long targetEntityId;

    @Column(columnDefinition = "TEXT")
    private String details; // JSON or free-form description

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;
}
