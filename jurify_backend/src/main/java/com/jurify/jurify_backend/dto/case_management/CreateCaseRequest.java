package com.jurify.jurify_backend.dto.case_management;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateCaseRequest {
    private String title;
    private String description;

    private String category;
    private String urgency;
    private String preferredLanguage;

    // Location Details
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String city;
    private String state;
    private String pincode;
    private String country;

    private String officeAddressLine1; // Maps to addressLine1 (using officeAddressLine1 to match frontend/logic
                                       // consistency if any, or just addressLine1)

    // Using addressLine1 for consistency with typical address fields, but frontend
    // might send officeAddressLine1 if it reuses lawyer components?
    // Checking frontend form: it sends `city`, `state`, `pincode`, `country`,
    // `latitude`, `longitude` separately.
    // Address text area in form? Form has "serviceAreas"? No, form has "Location"
    // step.
    // Let's stick to generic address fields.

    private String categorySpecificData; // JSON string
}
