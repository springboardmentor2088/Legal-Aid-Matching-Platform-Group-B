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

        public void createLawyerEntry(User user, String fullName, String phone, String city, String state,
                        String country,
                        String bio, boolean isVerified) {
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
                                .build();

                directoryEntryRepository.save(entry);
        }

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
                                .build();

                directoryEntryRepository.save(entry);
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
                DirectoryEntry entry = directoryEntryRepository.findByUser(user)
                                .orElseThrow(() -> new RuntimeException("Directory entry not found for this user"));

                entry.setIsActive(isActive);
                return directoryEntryRepository.save(entry);
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

                        directoryEntryRepository.save(entry);
                });
        }
}