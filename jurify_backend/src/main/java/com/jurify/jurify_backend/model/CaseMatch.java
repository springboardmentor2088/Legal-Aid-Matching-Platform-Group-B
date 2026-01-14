package com.jurify.jurify_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "case_matches", indexes = {
        @Index(name = "idx_match_case_id", columnList = "case_id"),
        @Index(name = "idx_match_provider", columnList = "provider_id, provider_type")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CaseMatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", nullable = false)
    private LegalCase legalCase;

    @Column(name = "provider_id", nullable = false)
    private Long providerId;

    @Column(name = "provider_type", nullable = false)
    private String providerType; // "LAWYER" or "NGO"

    @Column(name = "match_score", nullable = false)
    private Double matchScore; // 0-100

    @Column(name = "match_reasons", columnDefinition = "TEXT")
    private String matchReasons;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    @Builder.Default
    private MatchStatus status = MatchStatus.SUGGESTED;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
