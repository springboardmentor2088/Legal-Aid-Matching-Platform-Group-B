package com.jurify.jurify_backend.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkStatusRequest {
    private List<Long> userIds;
    private String status; // ACTIVE, SUSPENDED, BANNED
    private String reason;
}
