package com.jurify.jurify_backend.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LawyerInsightsDTO {
    private ImpactStatsDTO impactStats;
    private List<ChartDataDTO> resolutionTrend;
    private List<ChartDataDTO> caseDistribution;
    private List<GeoDataDTO> geoDistribution;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImpactStatsDTO {
        private int casesHandled;
        private int resolvedCases;
        private int avgResolutionTime; // in days
        private int successRate; // percentage
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChartDataDTO {
        private String name;
        private int value;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GeoDataDTO {
        private String name;
        private double lat;
        private double lng;
        private int count;
        private Long caseId;
        private String citizenName;
    }
}
