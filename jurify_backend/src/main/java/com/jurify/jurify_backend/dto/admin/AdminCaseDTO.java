package com.jurify.jurify_backend.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminCaseDTO {
    private String id; // "CAS-101"
    private String citizen; // Name
    private String lawyer; // Name
    private String category;
    private String status;
    private String priority;
    private String regDate;
    private String regTime;
    private String hearing; // Optional hearing info
    private String lawyerExp; // Optional
    private String lawyerCases; // Optional
    private String description;
    private List<String> documents;
    private List<String> activity;
}
