package com.jurify.jurify_backend.dto.auth;

import com.jurify.jurify_backend.model.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    @Builder.Default
    private String tokenType = "Bearer";
    private Long userId;
    private String email;
    private UserRole role;
    private boolean isEmailVerified;
    private String firstName;
    private String lastName;
    private String phone;
    private String gender;
    private String dob;

    // Lawyer & NGO details
    private String barCouncilNumber;
    private String barCouncilState;
    private Integer enrollmentYear;
    private String lawFirmName;
    private Integer yearsOfExperience;
    private String bio;
    private String languages;

    // NGO specific details
    private String ngoName; // Alias for organizationName
    private String darpanId;
    private String repName; // Alias for contactPersonName
    private String repRole; // Alias for contactPersonDesignation
    private String repEmail; // Alias for contactEmail or dedicated
    private String repGender;

    // Existing fields
    private String registrationNumber;
    private String registrationType;
    private Integer registrationYear;
    private String contactPersonName;
    private String contactEmail;
    private String contactPhone;
    private String organizationPhone;
    private String websiteUrl;
    private String serviceAreas;
    private String organizationEmail;
    private String contactPersonDesignation;
    private Boolean proBonoCommitment;
    private Integer maxProBonoCases;

    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String country;
    private String pincode;

    // New fields for Profile & Verification
    private String documentUrl;
    private String registrationCertificateUrl;
    private String ngoDarpanCertificateUrl;
    private String ngoPanCardUrl;
    private String authorizedIdProofUrl;
    private String verificationStatus; // e.g. PENDING, APPROVED, REJECTED
    @Builder.Default
    private Boolean isVerified = false;
    @Builder.Default
    private Boolean isActive = true;

    private java.util.List<String> caseTypes;
    private java.util.Map<String, Object> preferences;
}
