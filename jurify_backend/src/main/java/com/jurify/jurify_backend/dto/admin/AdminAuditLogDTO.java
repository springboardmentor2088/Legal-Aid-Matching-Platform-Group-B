package com.jurify.jurify_backend.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminAuditLogDTO {
    private String id; // e.g., "LOG-123"
    private String user; // Admin name
    private String role; // Admin role
    private String action; // e.g., "User Verified"
    private String module; // e.g., "User Management"
    private String status; // "Success", "Critical"
    private String time; // Formatted timestamp
    private String ip;
    private String device;
    private Map<String, Object> details;
}
