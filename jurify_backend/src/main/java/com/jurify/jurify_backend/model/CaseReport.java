package com.jurify.jurify_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "case_reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CaseReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "case_id", nullable = false)
    private Long caseId;

    // Use IDs instead of relationships to keep it lightweight, or fetch if needed
    // But for reporting, we usually just need the ID to link back
    // However, if we delete the case, we might want to keep the report?
    // If we delete the case, this link breaks.
    // So we should probably store snapshot data or handle foreign keys carefully.
    // For now, storing ID is safer if we soft delete, but if hard delete, this
    // becomes orphan.
    // Let's store simple ID.

    @Column(name = "reporter_id", nullable = false)
    private Long reporterId;

    @Column(name = "reporter_role", nullable = false)
    private String reporterRole;

    @Column(name = "reason", columnDefinition = "TEXT", nullable = false)
    private String reason;

    // Snapshot fields to preserve context after case deletion
    @Column(name = "case_title")
    private String caseTitle;

    @Column(name = "case_owner_email")
    private String caseOwnerEmail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportStatus status;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum ReportStatus {
        PENDING,
        REVIEWED,
        DISMISSED,
        RESOLVED // Case Removed
    }
}
