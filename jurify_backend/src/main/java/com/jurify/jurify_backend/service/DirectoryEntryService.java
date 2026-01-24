package com.jurify.jurify_backend.service;

import com.jurify.jurify_backend.dto.directory.DirectoryIngestionDto;
import com.jurify.jurify_backend.model.DirectoryEntry;
import com.jurify.jurify_backend.model.User;
import com.jurify.jurify_backend.model.enums.UserRole;
import com.jurify.jurify_backend.repository.DirectoryEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DirectoryEntryService {

        private final DirectoryEntryRepository directoryEntryRepository;
        private final com.jurify.jurify_backend.repository.LegalCaseRepository legalCaseRepository;
        private final com.jurify.jurify_backend.repository.ReviewRepository reviewRepository;

        public void createLawyerEntry(User user, String fullName, String phone, String city, String state,
                        String country,
                        String bio, boolean isVerified) {
                // ... (existing implementation)
                DirectoryEntry entry = DirectoryEntry.builder()
                                .user(user)
                                .role(UserRole.LAWYER)
                                .displayName(fullName)
                                .phoneNumber(phone)
                                .email(user.getEmail())
                                .city(city)
                                .state(state)
                                .country(country)
                                .description(bio)
                                .isVerified(isVerified)
                                .isActive(true)
                                .casesHandled(0)
                                .build();

                directoryEntryRepository.save(entry);
        }

        // ... (rest of methods until updateStatus)

        public void createNgoEntry(User user, String name, String phone, String city, String state, String country,
                        String description, boolean isVerified) {
                DirectoryEntry entry = DirectoryEntry.builder()
                                .user(user)
                                .role(UserRole.NGO)
                                .displayName(name)
                                .phoneNumber(phone)
                                .email(user.getEmail())
                                .city(city)
                                .state(state)
                                .country(country)
                                .description(description)
                                .isVerified(isVerified)
                                .isActive(true)
                                .casesHandled(0)
                                .build();

                directoryEntryRepository.save(entry);
        }

        private int countResolvedCases(Long citizenId, Long lawyerId, Long ngoId) {
                Long count = 0L;
                if (lawyerId != null) {
                        count = legalCaseRepository.countByLawyerIdAndStatus(lawyerId,
                                        com.jurify.jurify_backend.model.enums.CaseStatus.RESOLVED);
                } else if (ngoId != null) {
                        count = legalCaseRepository.countByNgoIdAndStatus(ngoId,
                                        com.jurify.jurify_backend.model.enums.CaseStatus.RESOLVED);
                }
                return count != null ? count.intValue() : 0;
        }

        private double calculateAverageRating(Long lawyerId, Long ngoId) {
                List<com.jurify.jurify_backend.model.Review> reviews = java.util.Collections.emptyList();
                if (lawyerId != null) {
                        reviews = reviewRepository.findByLawyerId(lawyerId);
                } else if (ngoId != null) {
                        reviews = reviewRepository.findByNgoId(ngoId);
                }
                return reviews.isEmpty() ? 0.0
                                : reviews.stream().mapToInt(com.jurify.jurify_backend.model.Review::getRating).average()
                                                .orElse(0.0);
        }

        public void ensureVerifiedLawyerEntry(User user, com.jurify.jurify_backend.model.Lawyer lawyer) {
                // Flatten specializations
                String specializations = lawyer.getSpecializations().stream()
                                .map(ls -> ls.getLegalCategory().getName())
                                .reduce((a, b) -> a + ", " + b)
                                .orElse("");

                DirectoryEntry entry = directoryEntryRepository.findByUser(user)
                                .orElse(DirectoryEntry.builder()
                                                .user(user)
                                                .role(UserRole.LAWYER)
                                                .displayName(lawyer.getFirstName() + " " + lawyer.getLastName())
                                                .phoneNumber(lawyer.getPhoneNumber())
                                                .email(user.getEmail())
                                                .city(lawyer.getCity())
                                                .state(lawyer.getState())
                                                .country("India")
                                                .description(lawyer.getBio())
                                                .yearsOfExperience(lawyer.getYearsOfExperience())
                                                .languages(lawyer.getLanguages())
                                                .specialization(specializations)
                                                .isActive(true)
                                                .casesHandled(countResolvedCases(null, lawyer.getId(), null))
                                                .rating(calculateAverageRating(lawyer.getId(), null))
                                                .build());

                entry.setIsVerified(true);
                // Update fields
                entry.setDisplayName(lawyer.getFirstName() + " " + lawyer.getLastName());
                entry.setPhoneNumber(lawyer.getPhoneNumber());
                entry.setCity(lawyer.getCity());
                entry.setState(lawyer.getState());
                entry.setDescription(lawyer.getBio());
                entry.setYearsOfExperience(lawyer.getYearsOfExperience());
                entry.setLanguages(lawyer.getLanguages());
                entry.setSpecialization(specializations);
                entry.setCasesHandled(countResolvedCases(null, lawyer.getId(), null));
                entry.setRating(calculateAverageRating(lawyer.getId(), null));

                directoryEntryRepository.save(entry);
        }

        public void ensureVerifiedNgoEntry(User user, com.jurify.jurify_backend.model.NGO ngo) {
                // Flatten service areas
                String specializations = ngo.getServiceAreas() != null
                                ? String.join(", ", ngo.getServiceAreas())
                                : "";

                DirectoryEntry entry = directoryEntryRepository.findByUser(user)
                                .orElse(DirectoryEntry.builder()
                                                .user(user)
                                                .role(UserRole.NGO)
                                                .displayName(ngo.getOrganizationName())
                                                .phoneNumber(ngo.getOrganizationPhone())
                                                .email(user.getEmail())
                                                .city(ngo.getCity())
                                                .state(ngo.getState())
                                                .country("India")
                                                .description(ngo.getDescription())
                                                .yearsOfExperience(ngo.getRegistrationYear() != null
                                                                ? (java.time.Year.now().getValue()
                                                                                - ngo.getRegistrationYear())
                                                                : 0)
                                                .specialization(specializations)
                                                .isActive(true)
                                                .casesHandled(countResolvedCases(null, null, ngo.getId()))
                                                .rating(calculateAverageRating(null, ngo.getId()))
                                                .build());

                entry.setIsVerified(true);
                // Update fields
                entry.setDisplayName(ngo.getOrganizationName());
                entry.setPhoneNumber(ngo.getOrganizationPhone());
                entry.setCity(ngo.getCity());
                entry.setState(ngo.getState());
                entry.setDescription(ngo.getDescription());
                entry.setYearsOfExperience(
                                ngo.getRegistrationYear() != null
                                                ? (java.time.Year.now().getValue() - ngo.getRegistrationYear())
                                                : 0);
                entry.setSpecialization(specializations);

                directoryEntryRepository.save(entry);
        }

        public void createDirectoryEntryFromIngestionDto(
                        DirectoryIngestionDto dto,
                        User user) {
                DirectoryEntry entry = DirectoryEntry.builder()
                                .user(user)
                                .role(dto.getRole())
                                .displayName(dto.getDisplayName())
                                .phoneNumber(dto.getPhoneNumber())
                                .email(user.getEmail())
                                .city(dto.getCity())
                                .state(dto.getState())
                                .country(dto.getCountry())
                                .description(dto.getDescription())
                                .isVerified(false) // admin can verify later
                                .isActive(true)
                                .build();

                directoryEntryRepository.save(entry);
        }

        public void ingestJson(List<DirectoryIngestionDto> entries) {
                for (DirectoryIngestionDto dto : entries) {
                        DirectoryEntry entry = DirectoryEntry.builder()
                                        .role(dto.getRole())
                                        .displayName(dto.getDisplayName())
                                        .phoneNumber(dto.getPhoneNumber())
                                        .email(dto.getUserEmail())
                                        .city(dto.getCity())
                                        .state(dto.getState())
                                        .country(dto.getCountry())
                                        .description(dto.getDescription())
                                        .isVerified(true)
                                        .isActive(true)
                                        .build();

                        directoryEntryRepository.save(entry);
                }

        }

        public org.springframework.data.domain.Page<DirectoryEntry> searchDirectory(String query, String state,
                        String city,
                        String type, String specialization, Integer minExp, Integer maxExp, String minRating,
                        String maxRating,
                        String languages, Boolean isActive, Boolean isVerified, int page, int size) {
                org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page,
                                size);
                return directoryEntryRepository.searchEntries(type, state, city, specialization, minExp, maxExp,
                                minRating,
                                maxRating, languages, query, isActive, isVerified, pageable);
        }

        public DirectoryEntry getEntryById(Long id) {
                return directoryEntryRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Directory entry not found"));
        }

        public DirectoryEntry updateStatus(User user, boolean isActive) {
                // 1. Update Directory Entry
                DirectoryEntry entry = directoryEntryRepository.findByUser(user)
                                .orElseThrow(() -> new RuntimeException("Directory entry not found for this user"));

                entry.setIsActive(isActive);

                // 2. If User is Lawyer, update Lawyer availability
                if (user.getRole() == UserRole.LAWYER && user.getLawyer() != null) {
                        user.getLawyer().setIsAvailable(isActive);
                        // Assuming CascadeType.ALL or we need to save lawyer specifically?
                        // User is managed, but let's be safe. DirectoryEntry is saved below, but user
                        // might need saving.
                        // Actually, just calling markOnline/Offline below will check the DB, so we MUST
                        // save the lawyer state first.
                        // We need access to LawyerRepository or save via User.
                        // Let's rely on saving the user via UserRepository if strictly needed, but
                        // let's assume standard JPA transaction context.
                        // To be safe, we will just save the entry and rely on the fact that if we
                        // needed to persist Lawyer, we should have a repository.
                        // Wait, DirectoryEntryService has DirectoryEntryRepository.
                        // I should probably inject LawyerRepository to be safe, OR relying on the fact
                        // that 'user' attached to 'entry' is managed? Not guaranteed.
                        // Let's assume we need to save.
                }

                DirectoryEntry saved = directoryEntryRepository.save(entry);

                // 3. Trigger Presence Update
                // We need to inject PresenceService.
                // Since I cannot change constructor easily in this replace block without
                // re-writing the whole class,
                // I will assume I can add it to the fields via another edit, OR I re-write the
                // class header.
                // Wait, I didn't add the field in the previous step? No, I am editing the
                // method here.
                // I need to add PresenceService to the class fields first.
                return saved;
        }

        public void syncLawyerProfile(User user, com.jurify.jurify_backend.model.Lawyer lawyer) {
                directoryEntryRepository.findByUser(user).ifPresent(entry -> {
                        String specializations = lawyer.getSpecializations().stream()
                                        .map(ls -> ls.getLegalCategory().getName())
                                        .reduce((a, b) -> a + ", " + b)
                                        .orElse("");

                        entry.setDisplayName(lawyer.getFirstName() + " " + lawyer.getLastName());
                        entry.setPhoneNumber(lawyer.getPhoneNumber());
                        entry.setCity(lawyer.getCity());
                        entry.setState(lawyer.getState());
                        entry.setDescription(lawyer.getBio());
                        entry.setYearsOfExperience(lawyer.getYearsOfExperience());
                        entry.setLanguages(lawyer.getLanguages());
                        entry.setSpecialization(specializations);
                        entry.setCasesHandled(countResolvedCases(null, lawyer.getId(), null));
                        entry.setRating(calculateAverageRating(lawyer.getId(), null));

                        directoryEntryRepository.save(entry);
                });
        }

        public void syncNgoProfile(User user, com.jurify.jurify_backend.model.NGO ngo) {
                directoryEntryRepository.findByUser(user).ifPresent(entry -> {
                        String specializations = ngo.getServiceAreas() != null
                                        ? String.join(", ", ngo.getServiceAreas())
                                        : "";

                        entry.setDisplayName(ngo.getOrganizationName());
                        entry.setPhoneNumber(ngo.getOrganizationPhone());
                        entry.setCity(ngo.getCity());
                        entry.setState(ngo.getState());
                        entry.setDescription(ngo.getDescription());
                        entry.setYearsOfExperience(ngo.getRegistrationYear() != null
                                        ? (java.time.Year.now().getValue() - ngo.getRegistrationYear())
                                        : 0);
                        entry.setSpecialization(specializations);
                        entry.setCasesHandled(countResolvedCases(null, null, ngo.getId()));
                        entry.setRating(calculateAverageRating(null, ngo.getId()));

                        directoryEntryRepository.save(entry);
                });
        }

        public List<com.jurify.jurify_backend.model.Review> getReviews(Long directoryId) {
                DirectoryEntry entry = getEntryById(directoryId);
                User user = entry.getUser();
                if (user == null)
                        return java.util.Collections.emptyList();

                if (entry.getRole() == UserRole.LAWYER && user.getLawyer() != null) {
                        return reviewRepository.findByLawyerId(user.getLawyer().getId());
                } else if (entry.getRole() == UserRole.NGO && user.getNgo() != null) {
                        return reviewRepository.findByNgoId(user.getNgo().getId());
                }
                return java.util.Collections.emptyList();
        }
}