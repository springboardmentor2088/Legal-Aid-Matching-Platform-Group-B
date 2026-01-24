package com.jurify.jurify_backend.service;

import com.jurify.jurify_backend.dto.analytics.LeaderboardEntryDTO;
import com.jurify.jurify_backend.model.Lawyer;
import com.jurify.jurify_backend.model.NGO;
import com.jurify.jurify_backend.model.enums.CaseStatus;
import com.jurify.jurify_backend.repository.LawyerRepository;
import com.jurify.jurify_backend.repository.LegalCaseRepository;
import com.jurify.jurify_backend.repository.NGORepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final LawyerRepository lawyerRepository;
    private final NGORepository ngoRepository;
    private final LegalCaseRepository legalCaseRepository;

    /**
     * Get top N lawyers by cases resolved/handled
     */
    @Transactional(readOnly = true)
    public List<LeaderboardEntryDTO> getTopLawyers(int limit) {
        // Get all verified lawyers and calculate their stats
        List<Lawyer> lawyers = lawyerRepository.findByIsVerifiedTrue();
        System.out.println("AnalyticsService: Found " + lawyers.size() + " verified lawyers");

        List<LeaderboardEntryDTO> leaderboard = new ArrayList<>();

        for (Lawyer lawyer : lawyers) {
            if (lawyer.getUser() == null)
                continue;

            // Count cases for this lawyer using lawyer entity ID
            Long lawyerId = lawyer.getId();
            Long casesResolved = legalCaseRepository.countByLawyerIdAndStatus(lawyerId, CaseStatus.RESOLVED);
            // Also count CLOSED cases as resolved/solved
            Long casesClosed = legalCaseRepository.countByLawyerIdAndStatus(lawyerId, CaseStatus.CLOSED);

            long totalSolved = (casesResolved != null ? casesResolved : 0) + (casesClosed != null ? casesClosed : 0);

            Long casesTotal = legalCaseRepository.countByLawyerId(lawyerId);

            LeaderboardEntryDTO entry = LeaderboardEntryDTO.builder()
                    .id(lawyer.getId())
                    .name(lawyer.getFirstName() + " " + lawyer.getLastName())
                    .email(lawyer.getUser().getEmail())
                    .city(lawyer.getCity())
                    .state(lawyer.getState())
                    .casesResolved((int) totalSolved)
                    .casesHandled(casesTotal != null ? casesTotal.intValue() : 0)
                    .rating(0.0) // Rating feature not yet implemented for lawyers
                    .type("LAWYER")
                    .build();

            leaderboard.add(entry);
        }

        // Sort by cases resolved (descending), then by rating (descending)
        leaderboard.sort((a, b) -> {
            int casesComparison = Integer.compare(b.getCasesResolved(), a.getCasesResolved());
            if (casesComparison != 0) {
                return casesComparison;
            }
            return Double.compare(b.getRating(), a.getRating());
        });

        System.out.println("AnalyticsService: Top lawyers sorted: " +
                leaderboard.stream().map(l -> l.getName() + "(" + l.getCasesResolved() + ")").limit(5)
                        .collect(java.util.stream.Collectors.joining(", ")));

        // Assign ranks and limit
        List<LeaderboardEntryDTO> result = new ArrayList<>();
        for (int i = 0; i < Math.min(limit, leaderboard.size()); i++) {
            LeaderboardEntryDTO entry = leaderboard.get(i);
            entry.setRank(i + 1);
            result.add(entry);
        }

        return result;
    }

    /**
     * Get top N NGOs by cases handled
     */
    @Transactional(readOnly = true)
    public List<LeaderboardEntryDTO> getTopNGOs(int limit) {
        List<NGO> ngos = ngoRepository.findByIsVerifiedTrue();

        List<LeaderboardEntryDTO> leaderboard = new ArrayList<>();

        for (NGO ngo : ngos) {
            if (ngo.getUser() == null)
                continue;

            // For NGOs, we might track referred cases or cases they've facilitated
            // For now, use a placeholder metric
            LeaderboardEntryDTO entry = LeaderboardEntryDTO.builder()
                    .id(ngo.getId())
                    .name(ngo.getOrganizationName())
                    .email(ngo.getUser().getEmail())
                    .city(ngo.getCity())
                    .state(ngo.getState())
                    .casesResolved(0) // TODO: Implement actual counting
                    .casesHandled(ngo.getMaxProBonoCases() != null ? ngo.getMaxProBonoCases() : 0)
                    .rating(0.0) // NGOs might not have ratings
                    .type("NGO")
                    .build();

            leaderboard.add(entry);
        }

        // Sort by cases handled (descending)
        leaderboard.sort(Comparator
                .comparingInt(LeaderboardEntryDTO::getCasesHandled).reversed());

        // Assign ranks and limit
        List<LeaderboardEntryDTO> result = new ArrayList<>();
        for (int i = 0; i < Math.min(limit, leaderboard.size()); i++) {
            LeaderboardEntryDTO entry = leaderboard.get(i);
            entry.setRank(i + 1);
            result.add(entry);
        }

        return result;
    }

    /**
     * Get insights for Lawyer Dashboard
     */
    @Transactional(readOnly = true)
    public com.jurify.jurify_backend.dto.analytics.LawyerInsightsDTO getLawyerInsights(Long lawyerId) {
        List<com.jurify.jurify_backend.model.LegalCase> cases = legalCaseRepository.findByLawyerId(lawyerId);

        int totalCases = cases.size();
        int resolvedCases = 0;
        long totalDurationSeconds = 0;
        int resolvedCountForAvg = 0;

        // Stats
        for (com.jurify.jurify_backend.model.LegalCase c : cases) {
            if (c.getStatus() == CaseStatus.RESOLVED) {
                resolvedCases++;
                if (c.getCreatedAt() != null && c.getUpdatedAt() != null) {
                    long duration = java.time.temporal.ChronoUnit.SECONDS.between(c.getCreatedAt(), c.getUpdatedAt());
                    totalDurationSeconds += duration;
                    resolvedCountForAvg++;
                }
            }
        }

        int avgDays = resolvedCountForAvg > 0 ? (int) (totalDurationSeconds / resolvedCountForAvg / 86400) : 0;
        int successRate = totalCases > 0 ? (resolvedCases * 100 / totalCases) : 0; // Simplified

        // Resolution Trend (Last 6 months)
        java.util.Map<java.time.YearMonth, Integer> trendMap = new java.util.TreeMap<>();
        java.time.YearMonth currentMonth = java.time.YearMonth.now();
        for (int i = 5; i >= 0; i--) {
            trendMap.put(currentMonth.minusMonths(i), 0);
        }

        for (com.jurify.jurify_backend.model.LegalCase c : cases) {
            if (c.getStatus() == CaseStatus.RESOLVED && c.getUpdatedAt() != null) {
                java.time.YearMonth ym = java.time.YearMonth.from(c.getUpdatedAt());
                if (trendMap.containsKey(ym)) {
                    trendMap.put(ym, trendMap.get(ym) + 1);
                }
            }
        }

        List<com.jurify.jurify_backend.dto.analytics.LawyerInsightsDTO.ChartDataDTO> resolutionTrend = new ArrayList<>();
        java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("MMM");
        trendMap.forEach((ym, count) -> {
            resolutionTrend.add(com.jurify.jurify_backend.dto.analytics.LawyerInsightsDTO.ChartDataDTO.builder()
                    .name(ym.format(formatter))
                    .value(count)
                    .build());
        });

        // Case Distribution
        java.util.Map<String, Integer> distMap = new java.util.HashMap<>();
        for (com.jurify.jurify_backend.model.LegalCase c : cases) {
            String cat = c.getCategory() != null ? c.getCategory() : "Uncategorized";
            distMap.put(cat, distMap.getOrDefault(cat, 0) + 1);
        }

        List<com.jurify.jurify_backend.dto.analytics.LawyerInsightsDTO.ChartDataDTO> caseDistribution = new ArrayList<>();
        distMap.forEach((cat, count) -> {
            caseDistribution.add(com.jurify.jurify_backend.dto.analytics.LawyerInsightsDTO.ChartDataDTO.builder()
                    .name(cat)
                    .value(count)
                    .build());
        });

        // Geo Distribution (Individual Pins per case with jitter for same city)
        List<com.jurify.jurify_backend.dto.analytics.LawyerInsightsDTO.GeoDataDTO> geoDistribution = new ArrayList<>();
        java.util.Random random = new java.util.Random();

        for (com.jurify.jurify_backend.model.LegalCase c : cases) {
            String city = "Unspecified";
            String citizenName = "Anonymous";

            if (c.getCitizen() != null) {
                citizenName = c.getCitizen().getFirstName() + " " + c.getCitizen().getLastName();
                if (c.getCitizen().getLocation() != null && c.getCitizen().getLocation().getCity() != null) {
                    city = c.getCitizen().getLocation().getCity();
                }
            }

            double[] coords = getCityCoordinates(city);
            // Add small jitter (±0.005 degrees ~500m) so multiple pins in same city don't
            // overlap perfectly
            double jitterLat = (random.nextDouble() - 0.5) * 0.01;
            double jitterLng = (random.nextDouble() - 0.5) * 0.01;

            geoDistribution.add(com.jurify.jurify_backend.dto.analytics.LawyerInsightsDTO.GeoDataDTO.builder()
                    .name(city)
                    .count(1)
                    .lat(coords[0] + jitterLat)
                    .lng(coords[1] + jitterLng)
                    .caseId(c.getId())
                    .citizenName(citizenName)
                    .build());
        }

        return com.jurify.jurify_backend.dto.analytics.LawyerInsightsDTO.builder()
                .impactStats(com.jurify.jurify_backend.dto.analytics.LawyerInsightsDTO.ImpactStatsDTO.builder()
                        .casesHandled(totalCases)
                        .resolvedCases(resolvedCases)
                        .avgResolutionTime(avgDays)
                        .successRate(successRate)
                        .build())
                .resolutionTrend(resolutionTrend)
                .caseDistribution(caseDistribution)
                .geoDistribution(geoDistribution)
                .build();
    }

    private double[] getCityCoordinates(String city) {
        // Simple lookup for demo
        switch (city.toLowerCase()) {
            case "mumbai":
                return new double[] { 19.0760, 72.8777 };
            case "delhi":
                return new double[] { 28.6139, 77.2090 };
            case "bangalore":
                return new double[] { 12.9716, 77.5946 };
            case "chennai":
                return new double[] { 13.0827, 80.2707 };
            case "kolkata":
                return new double[] { 22.5726, 88.3639 };
            case "hyderabad":
                return new double[] { 17.3850, 78.4867 };
            case "pune":
                return new double[] { 18.5204, 73.8567 };
            case "ahmedabad":
                return new double[] { 23.0225, 72.5714 };
            case "jaipur":
                return new double[] { 26.9124, 75.7873 };
            default:
                return new double[] { 20.5937, 78.9629 }; // Center of India
        }
    }

    /**
     * Get insights for Citizen Dashboard
     */
    @Transactional(readOnly = true)
    public com.jurify.jurify_backend.dto.analytics.CitizenInsightsDTO getCitizenInsights(Long citizenId) {
        List<com.jurify.jurify_backend.model.LegalCase> cases = legalCaseRepository.findByCitizenId(citizenId);

        // Resolution Trend (Last 6 months)
        java.util.Map<java.time.YearMonth, Integer> trendMap = new java.util.TreeMap<>();
        java.time.YearMonth currentMonth = java.time.YearMonth.now();
        for (int i = 5; i >= 0; i--) {
            trendMap.put(currentMonth.minusMonths(i), 0);
        }

        for (com.jurify.jurify_backend.model.LegalCase c : cases) {
            if (c.getStatus() == CaseStatus.RESOLVED && c.getUpdatedAt() != null) {
                java.time.YearMonth ym = java.time.YearMonth.from(c.getUpdatedAt());
                if (trendMap.containsKey(ym)) {
                    trendMap.put(ym, trendMap.get(ym) + 1);
                }
            }
        }

        List<com.jurify.jurify_backend.dto.analytics.CitizenInsightsDTO.ChartDataDTO> resolutionTrend = new ArrayList<>();
        java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("MMM");
        trendMap.forEach((ym, count) -> {
            resolutionTrend.add(com.jurify.jurify_backend.dto.analytics.CitizenInsightsDTO.ChartDataDTO.builder()
                    .name(ym.format(formatter))
                    .value(count)
                    .build());
        });

        // Status Distribution
        java.util.Map<String, Integer> statusMap = new java.util.HashMap<>();
        statusMap.put("PENDING", 0);
        statusMap.put("ACTIVE", 0);
        statusMap.put("RESOLVED", 0);

        for (com.jurify.jurify_backend.model.LegalCase c : cases) {
            String status = c.getStatus().name();
            statusMap.put(status, statusMap.getOrDefault(status, 0) + 1);
        }

        List<com.jurify.jurify_backend.dto.analytics.CitizenInsightsDTO.ChartDataDTO> statusDistribution = new ArrayList<>();
        statusMap.forEach((status, count) -> {
            statusDistribution.add(com.jurify.jurify_backend.dto.analytics.CitizenInsightsDTO.ChartDataDTO.builder()
                    .name(status)
                    .value(count)
                    .build());
        });

        return com.jurify.jurify_backend.dto.analytics.CitizenInsightsDTO.builder()
                .resolutionTrend(resolutionTrend)
                .statusDistribution(statusDistribution)
                .build();
    }
}
