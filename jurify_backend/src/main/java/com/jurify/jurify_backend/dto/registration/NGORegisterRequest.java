package com.jurify.jurify_backend.dto.registration;

import com.jurify.jurify_backend.model.enums.RegistrationType;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.validator.constraints.URL;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NGORegisterRequest {
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    private String password;

    private String preRegistrationToken;

    @NotBlank(message = "Organization name is required")
    private String organizationName;

    @NotBlank(message = "Registration number is required")
    private String registrationNumber;

    private RegistrationType registrationType;

    @Min(value = 1900, message = "Registration year must be valid")
    @Max(value = 2100, message = "Registration year must be valid")
    private Integer registrationYear;

    private java.time.LocalDate registrationDate;
    private String registeringAuthority;
    private String panNumber;

    @NotBlank(message = "Contact person name is required")
    private String contactPersonName;

    @Email(message = "Contact email must be valid")
    private String contactEmail;

    private String contactPhone;
    private String organizationPhone;

    @URL(message = "Website URL must be valid")
    private String websiteUrl;

    @Email(message = "Organization email must be valid")
    private String organizationEmail;

    private String contactPersonDesignation;

    private Boolean proBonoCommitment;
    private Integer maxProBonoCases;

    private String description;

    private String officeAddressLine1;
    private String officeAddressLine2;
    private String city;
    private String state;
    private String pincode;
    private String country;

    private java.math.BigDecimal latitude;
    private java.math.BigDecimal longitude;

    private java.util.List<String> areasOfWork;

    private String languages;
}
