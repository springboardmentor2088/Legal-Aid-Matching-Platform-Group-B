package com.jurify.jurify_backend.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaderboardEntryDTO {
    private Long id;
    private String name;
    private String email;
    private String city;
    private String state;
    private String profileImageUrl;
    private Integer casesResolved;
    private Integer casesHandled;
    private Double rating;
    private Integer rank;
    private String type; // LAWYER or NGO
}
