package com.jurify.jurify_backend.service;

import com.jurify.jurify_backend.dto.LocationUpdateDTO;
import com.jurify.jurify_backend.model.Citizen;
import com.jurify.jurify_backend.model.Lawyer;
import com.jurify.jurify_backend.model.Location;
import com.jurify.jurify_backend.model.NGO;
import com.jurify.jurify_backend.model.User;
import com.jurify.jurify_backend.repository.CitizenRepository;
import com.jurify.jurify_backend.repository.LawyerRepository;
import com.jurify.jurify_backend.repository.NGORepository;
import com.jurify.jurify_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final LawyerRepository lawyerRepository;
    private final NGORepository ngoRepository;
    private final CitizenRepository citizenRepository;

    private final com.jurify.jurify_backend.repository.VerificationRequestRepository verificationRequestRepository;

    @Transactional
    public void updateProfileLocation(Long userId, LocationUpdateDTO locationDTO) {
        // ... (keeping existing method for location-specific updates if needed, logic
        // is similar)
        // Actually, let's keep it as is or delegate?
        // For now, I will keep the original method and add the new one to avoid
        // breaking changes if anything uses the old one.
        // Wait, the instruction says "Reuse existing... or rewrite inline".
        // I will keep the previous method implementation and append the NEW method.
        // But the user asked me to REPLACE lines 27-83 which IS the existing method.
        // I should PROBABLY REPLACE IT with the new method AND keep the old one?
        // Or should I implement the new method separately?
        // The tool is replace_file_content.
        // I will INSERT the new method AFTER the existing one.
        // BUT wait, I have to target specific lines.
        // I'll rewrite the existing method and add the new one below it within the same
        // replacement block.

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        switch (user.getRole()) {
            case LAWYER:
                Lawyer lawyer = user.getLawyer();
                if (lawyer != null) {
                    lawyer.setLatitude(locationDTO.getLatitude());
                    lawyer.setLongitude(locationDTO.getLongitude());
                    lawyer.setCity(locationDTO.getCity());
                    lawyer.setState(locationDTO.getState());
                    lawyer.setPincode(locationDTO.getPincode());
                    lawyer.setCountry(locationDTO.getCountry());
                    lawyer.setOfficeAddressLine1(locationDTO.getAddressLine1());
                    lawyer.setOfficeAddressLine2(locationDTO.getAddressLine2());
                    lawyerRepository.save(lawyer);
                }
                break;
            case NGO:
                NGO ngo = user.getNgo();
                if (ngo != null) {
                    ngo.setLatitude(locationDTO.getLatitude());
                    ngo.setLongitude(locationDTO.getLongitude());
                    ngo.setCity(locationDTO.getCity());
                    ngo.setState(locationDTO.getState());
                    ngo.setPincode(locationDTO.getPincode());
                    ngo.setCountry(locationDTO.getCountry());
                    ngo.setOfficeAddressLine1(locationDTO.getAddressLine1());
                    ngo.setOfficeAddressLine2(locationDTO.getAddressLine2());
                    ngoRepository.save(ngo);
                }
                break;
            case CITIZEN:
                Citizen citizen = user.getCitizen();
                if (citizen != null) {
                    Location location = citizen.getLocation();
                    if (location == null) {
                        location = new com.jurify.jurify_backend.model.Location();
                        citizen.setLocation(location);
                    }
                    location.setCity(locationDTO.getCity());
                    location.setState(locationDTO.getState());
                    location.setPincode(locationDTO.getPincode());
                    location.setCountry(locationDTO.getCountry());
                    location.setLatitude(locationDTO.getLatitude());
                    location.setLongitude(locationDTO.getLongitude());

                    citizen.setAddressLine1(locationDTO.getAddressLine1());
                    citizen.setAddressLine2(locationDTO.getAddressLine2());
                    citizenRepository.save(citizen);
                }
                break;
            default:
                break;
        }
    }

    @Transactional
    public void updateProfile(Long userId, com.jurify.jurify_backend.dto.ProfileUpdateDTO profileDTO) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        switch (user.getRole()) {
            case CITIZEN:
                Citizen citizen = user.getCitizen();
                if (citizen != null) {
                    if (profileDTO.getFirstName() != null)
                        citizen.setFirstName(profileDTO.getFirstName());
                    if (profileDTO.getLastName() != null)
                        citizen.setLastName(profileDTO.getLastName());
                    if (profileDTO.getPhoneNumber() != null)
                        citizen.setPhoneNumber(profileDTO.getPhoneNumber());
                    if (profileDTO.getGender() != null)
                        citizen.setGender(profileDTO.getGender());
                    if (profileDTO.getDateOfBirth() != null)
                        citizen.setDateOfBirth(profileDTO.getDateOfBirth());

                    Location location = citizen.getLocation();
                    if (location == null) {
                        location = new Location();
                        citizen.setLocation(location);
                    }

                    if (profileDTO.getCity() != null)
                        location.setCity(profileDTO.getCity());
                    if (profileDTO.getState() != null)
                        location.setState(profileDTO.getState());
                    if (profileDTO.getPincode() != null)
                        location.setPincode(profileDTO.getPincode());
                    if (profileDTO.getCountry() != null)
                        location.setCountry(profileDTO.getCountry());
                    if (profileDTO.getLatitude() != null)
                        location.setLatitude(profileDTO.getLatitude());
                    if (profileDTO.getLongitude() != null)
                        location.setLongitude(profileDTO.getLongitude());

                    if (profileDTO.getAddressLine1() != null)
                        citizen.setAddressLine1(profileDTO.getAddressLine1());
                    if (profileDTO.getAddressLine2() != null)
                        citizen.setAddressLine2(profileDTO.getAddressLine2());

                    citizenRepository.save(citizen);
                }
                break;
            case LAWYER:
                Lawyer lawyer = user.getLawyer();
                if (lawyer != null) {
                    if (profileDTO.getFirstName() != null)
                        lawyer.setFirstName(profileDTO.getFirstName());
                    if (profileDTO.getLastName() != null)
                        lawyer.setLastName(profileDTO.getLastName());
                    // Lawyer might differentiate between office and personal address, but assuming
                    // unified for now as per previous logic
                    if (profileDTO.getCity() != null)
                        lawyer.setCity(profileDTO.getCity());
                    if (profileDTO.getState() != null)
                        lawyer.setState(profileDTO.getState());
                    if (profileDTO.getPincode() != null)
                        lawyer.setPincode(profileDTO.getPincode());
                    if (profileDTO.getCountry() != null)
                        lawyer.setCountry(profileDTO.getCountry());
                    if (profileDTO.getAddressLine1() != null)
                        lawyer.setOfficeAddressLine1(profileDTO.getAddressLine1());
                    if (profileDTO.getLatitude() != null)
                        lawyer.setLatitude(profileDTO.getLatitude());
                    if (profileDTO.getLongitude() != null)
                        lawyer.setLongitude(profileDTO.getLongitude());

                    lawyerRepository.save(lawyer);
                }
                break;
            case NGO:
                NGO ngo = user.getNgo();
                if (ngo != null) {
                    if (profileDTO.getOrganizationName() != null)
                        ngo.setOrganizationName(profileDTO.getOrganizationName());
                    if (profileDTO.getRegistrationNumber() != null)
                        ngo.setRegistrationNumber(profileDTO.getRegistrationNumber());
                    if (profileDTO.getRegistrationType() != null)
                        ngo.setRegistrationType(profileDTO.getRegistrationType());
                    if (profileDTO.getRegistrationYear() != null)
                        ngo.setRegistrationYear(profileDTO.getRegistrationYear());
                    if (profileDTO.getRegistrationDate() != null)
                        ngo.setRegistrationDate(profileDTO.getRegistrationDate());
                    if (profileDTO.getRegisteringAuthority() != null)
                        ngo.setRegisteringAuthority(profileDTO.getRegisteringAuthority());
                    if (profileDTO.getPanNumber() != null)
                        ngo.setPanNumber(profileDTO.getPanNumber());

                    if (profileDTO.getContactPersonName() != null)
                        ngo.setContactPersonName(profileDTO.getContactPersonName());
                    if (profileDTO.getContactEmail() != null)
                        ngo.setContactEmail(profileDTO.getContactEmail());
                    if (profileDTO.getContactPhone() != null)
                        ngo.setContactPhone(profileDTO.getContactPhone());
                    if (profileDTO.getOrganizationPhone() != null)
                        ngo.setOrganizationPhone(profileDTO.getOrganizationPhone());
                    if (profileDTO.getOrganizationEmail() != null)
                        ngo.setOrganizationEmail(profileDTO.getOrganizationEmail());
                    if (profileDTO.getContactPersonDesignation() != null)
                        ngo.setContactPersonDesignation(profileDTO.getContactPersonDesignation());

                    if (profileDTO.getWebsiteUrl() != null)
                        ngo.setWebsiteUrl(profileDTO.getWebsiteUrl());
                    if (profileDTO.getDescription() != null)
                        ngo.setDescription(profileDTO.getDescription());
                    if (profileDTO.getServiceAreas() != null)
                        ngo.setServiceAreas(profileDTO.getServiceAreas());

                    if (profileDTO.getProBonoCommitment() != null)
                        ngo.setProBonoCommitment(profileDTO.getProBonoCommitment());
                    if (profileDTO.getMaxProBonoCases() != null)
                        ngo.setMaxProBonoCases(profileDTO.getMaxProBonoCases());

                    if (profileDTO.getAddressLine1() != null)
                        ngo.setOfficeAddressLine1(profileDTO.getAddressLine1());
                    if (profileDTO.getAddressLine2() != null)
                        ngo.setOfficeAddressLine2(profileDTO.getAddressLine2());
                    if (profileDTO.getCity() != null)
                        ngo.setCity(profileDTO.getCity());
                    if (profileDTO.getState() != null)
                        ngo.setState(profileDTO.getState());
                    if (profileDTO.getPincode() != null)
                        ngo.setPincode(profileDTO.getPincode());
                    if (profileDTO.getCountry() != null)
                        ngo.setCountry(profileDTO.getCountry());
                    if (profileDTO.getLatitude() != null)
                        ngo.setLatitude(profileDTO.getLatitude());
                    if (profileDTO.getLongitude() != null)
                        ngo.setLongitude(profileDTO.getLongitude());

                    ngoRepository.save(ngo);
                }
                break;
            case ADMIN:
                // Admin profile update not yet implemented
                break;
        }
    }

    public com.jurify.jurify_backend.dto.auth.AuthResponse getCurrentUserResponse(User user) {
        var builder = com.jurify.jurify_backend.dto.auth.AuthResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .role(user.getRole())
                .isEmailVerified(user.getIsEmailVerified());

        if (user.getRole() == com.jurify.jurify_backend.model.enums.UserRole.CITIZEN) {
            Citizen citizen = user.getCitizen();
            if (citizen == null) {
                citizen = citizenRepository.findByUser_Id(user.getId()).orElse(null);
            }

            if (citizen != null) {
                builder.firstName(citizen.getFirstName())
                        .lastName(citizen.getLastName());

                com.jurify.jurify_backend.model.Location loc = citizen.getLocation();

                builder.phone(citizen.getPhoneNumber())
                        .gender(citizen.getGender() != null ? citizen.getGender().name() : null)
                        .dob(citizen.getDateOfBirth() != null ? citizen.getDateOfBirth().toString() : null)
                        .addressLine1(citizen.getAddressLine1())
                        .addressLine2(citizen.getAddressLine2());

                // Citizen Document
                if (citizen.getDocument() != null) {
                    builder.documentUrl(citizen.getDocument().getFileUrl());
                }
                // Citizen Verification based on Email
                builder.isVerified(user.getIsEmailVerified());
                builder.verificationStatus(user.getIsEmailVerified() ? "VERIFIED" : "PENDING");

                if (loc != null) {
                    builder.city(loc.getCity())
                            .state(loc.getState())
                            .country(loc.getCountry())
                            .pincode(loc.getPincode());
                }
            }
        } else if (user.getRole() == com.jurify.jurify_backend.model.enums.UserRole.LAWYER) {
            Lawyer lawyer = user.getLawyer();
            if (lawyer == null) {
                lawyer = lawyerRepository.findByUser_Id(user.getId()).orElse(null);
            }

            if (lawyer != null) {
                builder.firstName(lawyer.getFirstName())
                        .lastName(lawyer.getLastName());

                builder.phone(lawyer.getPhoneNumber())
                        .city(lawyer.getCity())
                        .state(lawyer.getState())
                        .country(lawyer.getCountry())
                        .pincode(lawyer.getPincode())
                        .addressLine1(lawyer.getOfficeAddressLine1())
                        .addressLine2(lawyer.getOfficeAddressLine2())
                        .barCouncilNumber(lawyer.getBarCouncilNumber())
                        .barCouncilState(lawyer.getBarCouncilState())
                        .enrollmentYear(lawyer.getEnrollmentYear())
                        .lawFirmName(lawyer.getLawFirmName())
                        .yearsOfExperience(lawyer.getYearsOfExperience())
                        .bio(lawyer.getBio())
                        .languages(lawyer.getLanguages());

                // Lawyer Verification from Entity
                builder.isVerified(lawyer.getIsVerified());
                builder.verificationStatus(
                        lawyer.getVerificationStatus() != null ? lawyer.getVerificationStatus().name() : "PENDING");

                // Fetch latest verification request for document
                verificationRequestRepository.findByUserId(user.getId()).stream()
                        .reduce((first, second) -> second) // Get last one
                        .ifPresent(req -> builder.documentUrl(req.getDocumentUrl()));
            }
        } else if (user.getRole() == com.jurify.jurify_backend.model.enums.UserRole.NGO) {
            NGO ngo = user.getNgo();
            if (ngo == null) {
                ngo = ngoRepository.findByUser_Id(user.getId()).orElse(null);
            }

            if (ngo != null) {
                builder.firstName(ngo.getOrganizationName()) // NGO uses Org Name as First Name equivalent for display
                        .lastName("");

                builder.phone(ngo.getContactPhone())
                        .city(ngo.getCity())
                        .state(ngo.getState())
                        .country(ngo.getCountry())
                        .pincode(ngo.getPincode())
                        .addressLine1(ngo.getOfficeAddressLine1())
                        .addressLine2(ngo.getOfficeAddressLine2())
                        .registrationNumber(ngo.getRegistrationNumber())
                        .registrationType(ngo.getRegistrationType() != null ? ngo.getRegistrationType().name() : null)
                        .registrationYear(ngo.getRegistrationYear())
                        .contactPersonName(ngo.getContactPersonName())
                        .organizationPhone(ngo.getOrganizationPhone())
                        .contactEmail(ngo.getContactEmail())
                        .contactPhone(ngo.getContactPhone())
                        .organizationEmail(ngo.getOrganizationEmail())
                        .websiteUrl(ngo.getWebsiteUrl())
                        .contactPersonDesignation(ngo.getContactPersonDesignation())
                        .proBonoCommitment(ngo.getProBonoCommitment())
                        .maxProBonoCases(ngo.getMaxProBonoCases())
                        .bio(ngo.getDescription()) // Map description to bio
                        .serviceAreas(ngo.getServiceAreas() != null ? String.join(", ", ngo.getServiceAreas()) : null);

                // NGO Verification from Entity
                builder.isVerified(ngo.getIsVerified());
                builder.verificationStatus(
                        ngo.getVerificationStatus() != null ? ngo.getVerificationStatus().name() : "PENDING");

                // Fetch document from NGODocument entity
                if (ngo.getDocuments() != null && !ngo.getDocuments().isEmpty()) {
                    builder.documentUrl(ngo.getDocuments().get(0).getFileUrl());
                }
            }
        }

        return builder.build();
    }
}
