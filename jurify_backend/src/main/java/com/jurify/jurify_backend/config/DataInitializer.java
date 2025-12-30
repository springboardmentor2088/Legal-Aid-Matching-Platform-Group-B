package com.jurify.jurify_backend.config;

import com.jurify.jurify_backend.model.Admin;
import com.jurify.jurify_backend.model.User;
import com.jurify.jurify_backend.model.enums.AdminLevel;
import com.jurify.jurify_backend.model.enums.UserRole;
import com.jurify.jurify_backend.repository.AdminRepository;
import com.jurify.jurify_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        initializeDefaultAdmin();
    }

    private void initializeDefaultAdmin() {
        String email = "jurify.springboard@gmail.com";
        if (userRepository.existsByEmail(email)) {
            log.info("Default admin already exists: {}", email);
            return;
        }

        log.info("Creating default admin: {}", email);

        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode("Admin@123")) // Default strong password
                .role(UserRole.ADMIN)
                .isEmailVerified(true)
                .isActive(true)
                .verificationPollingToken(UUID.randomUUID().toString())
                .build();

        user = userRepository.save(user);

        HashMap<String, Object> allPermissions = new HashMap<>();
        allPermissions.put("manage_users", true);
        allPermissions.put("manage_verifications", true);
        allPermissions.put("view_reports", true);
        allPermissions.put("manage_admins", true);
        allPermissions.put("system_settings", true);

        Admin admin = Admin.builder()
                .user(user)
                .firstName("System")
                .lastName("Admin")
                .phoneNumber("0000000000")
                .adminLevel(AdminLevel.SUPER_ADMIN)
                .permissions(allPermissions)
                .build();

        adminRepository.save(admin);
        log.info("Default admin created successfully.");
    }
}
