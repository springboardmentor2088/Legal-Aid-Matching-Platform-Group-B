package com.jurify.jurify_backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MatchResponseDTO {
    private Long id; // Match ID
    private Long providerId;
    private String providerType; // LAWYER / NGO
    private String name;
    private java.util.List<String> expertise; // List of specializations
    private String location;
    private String bio;
    private Double matchScore;
    private String matchReason;
    private Double rating;
    private String experience;
    private String contact;
    private String email;
    private String profilePic;
    private Boolean isAvailable;
    private Integer casesHandled;
    private String color; // UI color helper
}
