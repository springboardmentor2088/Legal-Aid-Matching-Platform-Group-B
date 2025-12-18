package com.jurify.jurify_backend.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.jurify.jurify_backend.model.enums.UserRole;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserDTO {
    private Long id;
    private String name;
    private String email;
    private UserRole role;
    private String status; // ACTIVE, SUSPENDED, PENDING
    private LocalDateTime joinedAt;
    private int activity; // Mock or real activity count
    private Boolean isVerified; // Added for verified status
}
