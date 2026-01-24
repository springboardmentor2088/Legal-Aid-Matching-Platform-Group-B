package com.jurify.jurify_backend.dto;

import com.jurify.jurify_backend.model.enums.AppointmentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentDTO {
    private Long id;
    private LocalDate date;
    private LocalTime time;
    private Long providerId;
    private Long requesterId;
    private Long caseId;
    private AppointmentStatus status;
    private String notes;
    private String googleEventId;
    private String meetLink;
    private Long initiatedBy;

    // Additional info for frontend
    private String providerName;
    private String requesterName;
    private String caseTitle;
}
