package com.jurify.jurify_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "lawyer_specializations", indexes = {
        @Index(name = "idx_lawyer_spec_lawyer_id", columnList = "lawyer_id"),
        @Index(name = "idx_lawyer_spec_cat_id", columnList = "legal_category_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LawyerSpecialization {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "lawyer_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    @lombok.ToString.Exclude
    private Lawyer lawyer;

    @ManyToOne
    @JoinColumn(name = "legal_category_id", nullable = false)
    private LegalCategory legalCategory;

    @Column(name = "years_of_experience")
    private Integer yearsOfExperience;

    @Column(name = "is_primary", nullable = false)
    @Builder.Default
    private Boolean isPrimary = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
