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
public class CaseDocumentDTO {
    private Long id;
    private String fileName;
    private String fileType;
    private String fileUrl;
    private LocalDateTime uploadedAt;
}
