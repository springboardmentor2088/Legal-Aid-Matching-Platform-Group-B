package com.jurify.jurify_backend.dto.registration;

import com.jurify.jurify_backend.model.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterResponse {
    private Long userId;
    private String email;
    private UserRole role;
    private String message;
    private String pollingToken;
}
