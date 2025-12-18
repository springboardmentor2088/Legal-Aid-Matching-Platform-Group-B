package com.jurify.jurify_backend.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsDTO {
    private long totalUsers;
    private long totalLawyers;
    private long totalNGOs;
    private long pendingVerifications;
    private long resolvedCases;
}
