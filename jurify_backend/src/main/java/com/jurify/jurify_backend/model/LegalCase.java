package com.jurify.jurify_backend.model;

import com.jurify.jurify_backend.model.enums.CaseStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "legal_cases", indexes = {
        @Index(name = "idx_case_citizen_id", columnList = "citizen_id"),
        @Index(name = "idx_case_lawyer_id", columnList = "lawyer_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LegalCase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private CaseStatus status = CaseStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "category")
    private com.jurify.jurify_backend.model.enums.CaseCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "urgency")
    private com.jurify.jurify_backend.model.enums.CaseUrgency urgency;

    @Enumerated(EnumType.STRING)
    @Column(name = "preferred_language")
    private com.jurify.jurify_backend.model.enums.Language preferredLanguage;

    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "location_id")
    private Location location;

    @Column(name = "address_line_1")
    private String addressLine1;

    @Column(name = "category_specific_data", columnDefinition = "TEXT")
    private String categorySpecificData;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "citizen_id", nullable = false)
    private Citizen citizen;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lawyer_id")
    private Lawyer lawyer;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "legalCase", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private java.util.List<CaseDocument> documents;
}
