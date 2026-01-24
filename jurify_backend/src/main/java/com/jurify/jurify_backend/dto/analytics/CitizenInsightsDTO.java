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
public class CitizenInsightsDTO {
    private List<ChartDataDTO> resolutionTrend;
    private List<ChartDataDTO> statusDistribution;
    // We can reuse the ChartDataDTO static class from LawyerInsightsDTO or define
    // here.
    // To be clean and avoid dependency on LawyerInsightsDTO inner class if we
    // refactor, I'll define it or use a shared DTO.
    // For now, I'll define a separate inner class to be self-contained or import.
    // Actually, let's just use the same structure since it's simple.

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChartDataDTO {
        private String name;
        private int value;
    }
}
