package com.jurify.jurify_backend.scheduler;

import com.jurify.jurify_backend.model.DirectoryEntry;
import com.jurify.jurify_backend.repository.DirectoryEntryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class InactivityScheduler {

    private final DirectoryEntryRepository directoryEntryRepository;

    @Scheduled(cron = "0 0 0 * * ?") // Every day at midnight
    @Transactional
    public void deactivateInactiveUsers() {
        log.info("Running inactivity check...");

        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(30);
        List<DirectoryEntry> inactiveEntries = directoryEntryRepository.findInactiveEntries(cutoffDate);

        if (inactiveEntries.isEmpty()) {
            log.info("No inactive users found.");
            return;
        }

        log.info("Found {} users inactive for more than 30 days. Deactivating...", inactiveEntries.size());

        for (DirectoryEntry entry : inactiveEntries) {
            entry.setIsActive(false);
            directoryEntryRepository.save(entry);
            log.info("Deactivated user: {}", entry.getDisplayName());
        }

        log.info("Inactivity check completed.");
    }
}
