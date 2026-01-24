package com.jurify.jurify_backend.dto.case_resolution;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResolutionAcknowledgmentDTO {
    private Integer rating;
    private String feedback;
}
