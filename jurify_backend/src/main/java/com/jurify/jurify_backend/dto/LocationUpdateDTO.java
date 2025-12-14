package com.jurify.jurify_backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class LocationUpdateDTO {
    @NotNull(message = "Latitude is required")
    private BigDecimal latitude;

    @NotNull(message = "Longitude is required")
    private BigDecimal longitude;

    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String pincode;
    private String country;
}
