package com.jurify.jurify_backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VerificationRequestDTO {
    @NotBlank(message = "Document URL is required")
    private String documentUrl;

    @NotBlank(message = "Document Type is required")
    private String documentType;
}
