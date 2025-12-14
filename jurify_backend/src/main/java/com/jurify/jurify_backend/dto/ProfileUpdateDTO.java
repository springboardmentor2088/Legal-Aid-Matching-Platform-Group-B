package com.jurify.jurify_backend.dto;

import com.jurify.jurify_backend.model.enums.Gender;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ProfileUpdateDTO {
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private Gender gender;
    private LocalDate dateOfBirth;

    // NGO Details
    private String organizationName;
    private String registrationNumber;
    private com.jurify.jurify_backend.model.enums.RegistrationType registrationType;
    private Integer registrationYear;
    private LocalDate registrationDate;
    private String registeringAuthority;
    private String panNumber;
    private String contactPersonName;
    private String contactEmail;
    private String contactPhone;
    private String organizationPhone;
    private String organizationEmail;
    private String contactPersonDesignation;
    private String websiteUrl;
    private String description;
    private java.util.List<String> serviceAreas;
    private Boolean proBonoCommitment;
    private Integer maxProBonoCases;

    // Location details
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String pincode;
    private String country;
    private BigDecimal latitude;
    private BigDecimal longitude;
}
