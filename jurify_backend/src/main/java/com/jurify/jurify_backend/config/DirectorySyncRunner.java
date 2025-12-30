package com.jurify.jurify_backend.config;

import com.jurify.jurify_backend.model.Lawyer;
import com.jurify.jurify_backend.model.NGO;
import com.jurify.jurify_backend.repository.LawyerRepository;
import com.jurify.jurify_backend.repository.NGORepository;
import com.jurify.jurify_backend.service.DirectoryEntryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DirectorySyncRunner implements CommandLineRunner {

    private final LawyerRepository lawyerRepository;
    private final NGORepository ngoRepository;
    private final DirectoryEntryService directoryEntryService;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("Starting Directory Sync...");

        // Sync Lawyers
        List<Lawyer> verifiedLawyers = lawyerRepository.findByIsVerifiedTrue();
        log.info("Found {} verified lawyers to sync.", verifiedLawyers.size());
        for (Lawyer lawyer : verifiedLawyers) {
            try {
                directoryEntryService.ensureVerifiedLawyerEntry(lawyer.getUser(), lawyer);
            } catch (Exception e) {
                log.error("Failed to sync lawyer: {}", lawyer.getId(), e);
            }
        }

        // Sync NGOs
        List<NGO> verifiedNgos = ngoRepository.findByIsVerifiedTrue();
        log.info("Found {} verified NGOs to sync.", verifiedNgos.size());
        for (NGO ngo : verifiedNgos) {
            try {
                directoryEntryService.ensureVerifiedNgoEntry(ngo.getUser(), ngo);
            } catch (Exception e) {
                log.error("Failed to sync NGO: {}", ngo.getId(), e);
            }
        }

        log.info("Directory Sync Completed.");
    }
}
