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
    private String caseNumber;
    private String title;
    private String description;
    private CaseStatus status;
    private String lawyerName;
    private Long lawyerId;
    private String lawyerEmail;
    private String lawyerPhone;
    private String ngoName;
    private String ngoEmail;
    private String ngoPhone;
    private Long citizenId;
    private Long citizenUserId;
    private String citizenName;
    private String citizenEmail;
    private String citizenPhone;
    private String category;
    private String urgency;
    private String preferredLanguage;
    private String locationCity;
    private java.util.List<CaseDocumentDTO> documents;
    private long unreadCount;
    private boolean hasStartedChat;
    private String onlineStatus;
    private Boolean isLawyerAvailable;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
