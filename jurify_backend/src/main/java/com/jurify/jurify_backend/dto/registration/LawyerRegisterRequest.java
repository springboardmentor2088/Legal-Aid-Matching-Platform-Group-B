package com.jurify.jurify_backend.dto.registration;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LawyerRegisterRequest {
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    private String password;

    private String preRegistrationToken;

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    private String phoneNumber;

    @NotBlank(message = "Bar council number is required")
    private String barCouncilNumber;

    @NotBlank(message = "Bar council state is required")
    private String barCouncilState;

    @Min(value = 1900, message = "Enrollment year must be valid")
    @Max(value = 2100, message = "Enrollment year must be valid")
    private Integer enrollmentYear;

    private String lawFirmName;

    @Min(value = 0, message = "Years of experience must be non-negative")
    private Integer yearsOfExperience;

    private String bio;

    private String languages;

    private String officeAddressLine1;
    private String officeAddressLine2;
    private String city;
    private String state;
    private String pincode;
    private String country;

    private java.math.BigDecimal latitude;
    private java.math.BigDecimal longitude;

    private java.util.List<String> caseTypes;
}
