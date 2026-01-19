package com.jurify.jurify_backend.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.jurify.jurify_backend.model.enums.UserRole;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserDTO {
    private Long id;
    private String name;
    private String email;
    private String phone; // Added
    private String city; // Added
    private String state; // Added
    private UserRole role;
    private String accountStatus; // Mapped from isActive
    private String verificationStatus; // PENDING, APPROVED, REJECTED
    private Boolean isVerified; // Added for easier filtering
    private LocalDateTime joinedAt;
    private LocalDateTime lastActive; // Added
    private String documentUrl; // Added for verification fallback
    private String documentType; // Added for verification fallback

    // Lawyer specific
    private String barCouncilNumber;
    private java.util.List<String> specializations;
    private Integer yearsOfExperience;
    private String rating;
    private String availability;
    private Integer casesHandled; // Added

    // NGO specific
    private String ngoDarpanId; // Mapped from registrationNumber
    private java.util.List<String> areasOfWork; // Mapped from serviceAreas
    private Integer proBonoCapacity; // Mapped from maxProBonoCases
    private Integer activeCases;

    // Citizen specific
    private Integer totalCasesSubmitted;
    private LocalDateTime lastCaseDate;

    public String getStatus() {
        return accountStatus;
    } // Backwards compatibility if needed
}
