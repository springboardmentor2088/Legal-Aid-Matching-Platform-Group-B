package com.jurify.jurify_backend.service;

import com.jurify.jurify_backend.model.User;
import com.jurify.jurify_backend.model.enums.UserRole;
import com.jurify.jurify_backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private EmailService emailService; // In case it's used

    @InjectMocks
    private AdminService adminService;

    @BeforeEach
    void setUp() {
        // Mock Security Context for "getCurrentAdminId" if needed
        // Assuming adminService.getCurrentAdminId() uses SecurityContextHolder
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        lenient().when(securityContext.getAuthentication()).thenReturn(authentication);
        lenient().when(authentication.getName()).thenReturn("admin@example.com");
        // We might need to mock principal if logic depends on it
        // Check AdminService implementation if it casts principal
        // For now, lenient stubbing.

        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    void verifyUser_ShouldLogAction() {
        Long userId = 100L;
        User user = new User();
        user.setId(userId);
        user.setIsEmailVerified(false);
        user.setRole(UserRole.CITIZEN); // Basic user

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        adminService.verifyUser(userId);

        verify(userRepository).save(user);
        verify(auditLogService).logAction(eq("VERIFY_USER"), any(), eq(userId), anyString(), any());
    }

    @Test
    void updateUserStatus_ShouldLogAction() {
        Long userId = 101L;
        User user = new User();
        user.setId(userId);
        user.setIsActive(true);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        adminService.updateUserStatus(userId, "SUSPENDED", "Violation of terms");

        verify(userRepository).save(user);
        // User should be inactive now? Logic depends on implementation (status string
        // vs boolean)
        // AdminService likely maps "SUSPENDED" to isActive=false or similar.
        verify(auditLogService).logAction(eq("UPDATE_STATUS"), any(), eq(userId), contains("SUSPENDED"), any());
    }
}
