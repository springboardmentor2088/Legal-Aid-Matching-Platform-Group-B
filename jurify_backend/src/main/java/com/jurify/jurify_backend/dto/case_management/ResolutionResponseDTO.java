package com.jurify.jurify_backend.dto.case_management;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResolutionResponseDTO {
    private Long caseId;
    private String caseTitle;
    private String status;
    private String resolutionDocumentUrl;
    private String resolutionNotes;
    private LocalDateTime resolutionSubmittedAt;
    private String submittedByName;
    private LocalDateTime resolutionAcknowledgedAt;
    private String message;
}
