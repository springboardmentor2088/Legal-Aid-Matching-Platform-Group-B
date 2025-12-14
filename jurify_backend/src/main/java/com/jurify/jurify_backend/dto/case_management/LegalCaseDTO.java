package com.jurify.jurify_backend.dto.case_management;

import com.jurify.jurify_backend.model.enums.CaseStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LegalCaseDTO {
    private Long id;
    private String title;
    private String description;
    private CaseStatus status;
    private String lawyerName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
