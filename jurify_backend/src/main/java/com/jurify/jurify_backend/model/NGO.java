package com.jurify.jurify_backend.model;

import com.jurify.jurify_backend.model.enums.RegistrationType;
import com.jurify.jurify_backend.model.enums.VerificationStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ngos", indexes = {
        @Index(name = "idx_ngo_user_id", columnList = "user_id"),
        @Index(name = "idx_ngo_reg_num", columnList = "registration_number")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NGO {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User user;

    @Column(name = "organization_name", nullable = false)
    private String organizationName;

    @Column(name = "registration_number", unique = true)
    private String registrationNumber;

    @Column(name = "darpan_id")
    private String darpanId;

    @Enumerated(EnumType.STRING)
    @Column(name = "registration_type")
    private RegistrationType registrationType;

    @Column(name = "registration_date")
    private java.time.LocalDate registrationDate;

    @Column(name = "registering_authority")
    private String registeringAuthority;

    @Column(name = "pan_number")
    private String panNumber;

    @Column(name = "registration_year")
    private Integer registrationYear;

    @Column(name = "contact_person_name")
    private String contactPersonName;

    @Column(name = "contact_email")
    private String contactEmail;

    @Column(name = "contact_phone")
    private String contactPhone;

    @Column(name = "organization_phone")
    private String organizationPhone;

    @Column(name = "website_url")
    private String websiteUrl;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "organization_email")
    private String organizationEmail;

    @Column(name = "contact_person_designation")
    private String contactPersonDesignation;

    @Column(name = "representative_dob")
    private java.time.LocalDate representativeDob;

    @Column(name = "representative_gender")
    private String representativeGender;

    @Column(name = "pro_bono_commitment")
    private Boolean proBonoCommitment;

    @Column(name = "max_pro_bono_cases")
    private Integer maxProBonoCases;

    @Column(name = "office_address_line1")
    private String officeAddressLine1;

    @Column(name = "office_address_line2")
    private String officeAddressLine2;

    private String city;

    private String state;

    private String pincode;

    private String country;

    @Column(precision = 10, scale = 8)
    private BigDecimal latitude;

    @Column(precision = 11, scale = 8)
    private BigDecimal longitude;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "service_areas", columnDefinition = "jsonb")
    private List<String> serviceAreas;

    @Column(name = "languages")
    private String languages;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "is_verified", nullable = false)
    @Builder.Default
    private Boolean isVerified = false;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status")
    @Builder.Default
    private VerificationStatus verificationStatus = VerificationStatus.PENDING;

    @Column(name = "verification_date")
    private LocalDateTime verificationDate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "ngo", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<NGODocument> documents = new ArrayList<>();

    @OneToMany(mappedBy = "ngo", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<NGOSpecialization> specializations = new ArrayList<>();

    @Column(name = "average_rating")
    @Builder.Default
    private Double averageRating = 0.0;

    @Column(name = "review_count")
    @Builder.Default
    private Integer reviewCount = 0;

    @Column(name = "cases_handled")
    @Builder.Default
    private Integer casesHandled = 0;
}
