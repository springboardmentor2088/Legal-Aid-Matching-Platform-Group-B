package com.jurify.jurify_backend.model;

import com.jurify.jurify_backend.model.enums.UserRole;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "directory_entries", indexes = {
        @Index(name = "idx_directory_role", columnList = "role"),
        @Index(name = "idx_directory_city", columnList = "city"),
        @Index(name = "idx_directory_verified", columnList = "isVerified")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DirectoryEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Linked user (LAWYER / NGO only) */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    /** Display details */
    private String displayName;
    private String phoneNumber;
    private String email;

    /** Location */
    private String city;
    private String state;
    private String country;

    /** Profile */
    @Column(length = 2000)
    private String description;

    /** Additional Details */
    private Integer yearsOfExperience;
    private String languages; // Comma separated
    private String specialization; // Comma separated
    private Double rating; // Out of 5.0
    private Integer casesHandled; // Added field for cases count

    /** Status */
    @Column(nullable = false)
    private Boolean isVerified;

    @Column(nullable = false)
    private Boolean isActive;

    @com.fasterxml.jackson.annotation.JsonProperty("userId")
    public Long getUserId() {
        return user != null ? user.getId() : null;
    }

    @CreationTimestamp
    private LocalDateTime createdAt;
}
