package com.jurify.jurify_backend.dto.case_management;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CaseStatsDTO {
    private Long totalCases;
    private Long activeCases;
    private Long pendingCases;
    private Long resolvedCases;
}
