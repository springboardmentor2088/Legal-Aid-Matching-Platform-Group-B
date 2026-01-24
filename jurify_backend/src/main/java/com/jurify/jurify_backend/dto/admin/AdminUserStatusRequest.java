package com.jurify.jurify_backend.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserStatusRequest {
    private String status; // ACTIVE, SUSPENDED, BANNED
    private String reason;
}
