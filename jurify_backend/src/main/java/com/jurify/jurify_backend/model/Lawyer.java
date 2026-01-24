package com.jurify.jurify_backend.model;

import com.jurify.jurify_backend.model.enums.VerificationStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "lawyers", indexes = {
        @Index(name = "idx_lawyer_user_id", columnList = "user_id"),
        @Index(name = "idx_lawyer_bcn", columnList = "bar_council_number")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Lawyer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User user;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "bar_council_number", unique = true)
    private String barCouncilNumber;

    @Column(name = "bar_council_state")
    private String barCouncilState;

    @Column(name = "enrollment_year")
    private Integer enrollmentYear;

    @Column(name = "law_firm_name")
    private String lawFirmName;

    @Column(name = "years_of_experience")
    private Integer yearsOfExperience;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "languages")
    private String languages;

    @Column(name = "dob")
    private java.time.LocalDate dob;

    @Column(name = "gender")
    private String gender;

    @Column(name = "profile_picture_url")
    private String profilePictureUrl;

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

    @Column(name = "is_verified", nullable = false)
    @Builder.Default
    private Boolean isVerified = false;

    @Column(name = "is_available", nullable = false)
    @Builder.Default
    private Boolean isAvailable = true;

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

    @OneToMany(mappedBy = "lawyer", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<LawyerSpecialization> specializations = new ArrayList<>();

    @OneToOne(mappedBy = "lawyer", cascade = CascadeType.ALL, orphanRemoval = true)
    private LawyerDocument document;

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
