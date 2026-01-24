package com.jurify.jurify_backend.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ConsultationLeadDTO {
    private Long caseId;
    private String caseNumber;
    private String caseTitle;
    private String caseStatus; // Should be matched with Lead Status
    private String citizenName;
    private String location;
    private String urgency;
    private LocalDateTime requestedAt;
    private String matchStatus; // CONTACTED, SUGGESTED
    private String description;
    private String category;
    private String providerName;
    private String providerType;
    private String fileUrl;
}
