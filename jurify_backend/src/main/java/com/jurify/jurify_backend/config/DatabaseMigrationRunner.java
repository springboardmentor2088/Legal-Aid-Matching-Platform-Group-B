package com.jurify.jurify_backend.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class DatabaseMigrationRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("Running database migration to fix constraints...");
        try {
            jdbcTemplate.execute("ALTER TABLE legal_cases DROP CONSTRAINT IF EXISTS legal_cases_status_check");
            jdbcTemplate.execute(
                    "ALTER TABLE legal_cases ADD CONSTRAINT legal_cases_status_check CHECK (status IN ('PENDING', 'ACTIVE', 'PENDING_RESOLUTION', 'RESOLVED', 'CLOSED'))");
            System.out.println("Database migration completed successfully.");
        } catch (Exception e) {
            System.err.println("Database migration failed: " + e.getMessage());
            // Proceed anyway as it might have already been done or format is different
        }
    }
}
