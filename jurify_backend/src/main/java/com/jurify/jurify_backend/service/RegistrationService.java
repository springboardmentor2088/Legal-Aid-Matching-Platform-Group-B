package com.jurify.jurify_backend.service;

import com.jurify.jurify_backend.dto.registration.*;
import com.jurify.jurify_backend.model.*;
import com.jurify.jurify_backend.model.enums.UserRole;
import com.jurify.jurify_backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.UUID;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
@Slf4j
public class RegistrationService {

        private final VerificationRequestRepository verificationRequestRepository;
        private final UserRepository userRepository;
        private final CitizenRepository citizenRepository;
        private final LawyerRepository lawyerRepository;
        private final NGORepository ngoRepository;
        private final AdminRepository adminRepository;
        private final PasswordEncoder passwordEncoder;
        private final EmailService emailService;
        private final EmailVerificationTokenRepository emailVerificationTokenRepository;

        private final CloudflareR2Service r2Service;

        @Transactional
        public RegisterResponse registerCitizen(CitizenRegisterRequest request,
                        org.springframework.web.multipart.MultipartFile file) throws java.io.IOException {
                // Check if email already exists
                if (userRepository.existsByEmail(request.getEmail())) {
                        throw new RuntimeException("Email already registered");
                }

                // Create User
                User user = User.builder()
                                .email(request.getEmail())
                                .passwordHash(passwordEncoder.encode(request.getPassword()))
                                .role(UserRole.CITIZEN)
                                .isEmailVerified(false)
                                .isActive(true)
                                .verificationPollingToken(UUID.randomUUID().toString())
                                .build();

                user = userRepository.save(user);

                // Create Location
                Location location = Location.builder()
                                .city(request.getCity())
                                .state(request.getState())
                                .pincode(request.getPincode())
                                .country(request.getCountry())
                                .latitude(request.getLatitude())
                                .longitude(request.getLongitude())
                                .build();

                // Create Citizen profile
                Citizen citizen = Citizen.builder()
                                .user(user)
                                .firstName(request.getFirstName())
                                .lastName(request.getLastName())
                                .phoneNumber(request.getPhoneNumber())
                                .dateOfBirth(request.getDateOfBirth())
                                .gender(request.getGender())
                                .addressLine1(request.getAddressLine1())
                                .addressLine2(request.getAddressLine2())
                                .location(location)
                                .build();

                // Handle file upload
                if (file != null && !file.isEmpty()) {
                        String s3Key = r2Service.uploadFile(file, "citizens/" + user.getId() + "/documents");
                        String fileUrl = "https://jurify-storage.318a1e3b8170016e8898a857e83852a8.r2.cloudflarestorage.com/"
                                        + s3Key;

                        CitizenDocument document = CitizenDocument.builder()
                                        .citizen(citizen)
                                        .fileName(file.getOriginalFilename())
                                        .fileType(file.getContentType())
                                        .s3Key(s3Key)
                                        .fileUrl(fileUrl)
                                        .build();

                        citizen.setDocument(document);
                }

                citizenRepository.save(citizen);
                sendVerificationEmail(user);

                log.info("Citizen registered successfully: {}", request.getEmail());

                return RegisterResponse.builder()
                                .userId(user.getId())
                                .email(user.getEmail())
                                .role(user.getRole())
                                .message("Citizen registered successfully. Please verify your email.")
                                .pollingToken(user.getVerificationPollingToken())
                                .build();
        }

        @Transactional
        public RegisterResponse registerLawyer(LawyerRegisterRequest request,
                        org.springframework.web.multipart.MultipartFile file) throws java.io.IOException {
                // Check if email already exists
                if (userRepository.existsByEmail(request.getEmail())) {
                        throw new RuntimeException("Email already registered");
                }

                // Check if bar council number already exists
                if (lawyerRepository.existsByBarCouncilNumber(request.getBarCouncilNumber())) {
                        throw new RuntimeException("Bar council number already registered");
                }

                // Create User
                User user = User.builder()
                                .email(request.getEmail())
                                .passwordHash(passwordEncoder.encode(request.getPassword()))
                                .role(UserRole.LAWYER)
                                .isEmailVerified(false)
                                .isActive(true)
                                .verificationPollingToken(UUID.randomUUID().toString())
                                .build();

                user = userRepository.save(user);

                // Create Lawyer profile
                Lawyer lawyer = Lawyer.builder()
                                .user(user)
                                .firstName(request.getFirstName())
                                .lastName(request.getLastName())
                                .phoneNumber(request.getPhoneNumber())
                                .barCouncilNumber(request.getBarCouncilNumber())
                                .barCouncilState(request.getBarCouncilState())
                                .enrollmentYear(request.getEnrollmentYear())
                                .lawFirmName(request.getLawFirmName())
                                .yearsOfExperience(request.getYearsOfExperience())
                                .bio(request.getBio())
                                .languages(request.getLanguages())
                                .officeAddressLine1(request.getOfficeAddressLine1())
                                .officeAddressLine2(request.getOfficeAddressLine2())
                                .city(request.getCity())
                                .state(request.getState())
                                .pincode(request.getPincode())
                                .country(request.getCountry())
                                .latitude(request.getLatitude())
                                .longitude(request.getLongitude())
                                .isVerified(false)
                                .isAvailable(true)
                                .build();

                // Handle file upload
                if (file != null && !file.isEmpty()) {
                        String s3Key = r2Service.uploadFile(file, "lawyers/" + user.getId() + "/documents");
                        String fileUrl = "https://jurify-storage.318a1e3b8170016e8898a857e83852a8.r2.cloudflarestorage.com/"
                                        + s3Key;

                        LawyerDocument document = LawyerDocument.builder()
                                        .lawyer(lawyer)
                                        .fileName(file.getOriginalFilename())
                                        .fileType(file.getContentType())
                                        .s3Key(s3Key)
                                        .fileUrl(fileUrl)
                                        .build();

                        lawyer.setDocument(document);

                        // AUTOMATICALLY CREATE VERIFICATION REQUEST
                        createVerificationRequest(user, fileUrl, "Lawyer ID Card");
                }

                lawyerRepository.save(lawyer);
                sendVerificationEmail(user);

                log.info("Lawyer registered successfully: {}", request.getEmail());

                return RegisterResponse.builder()
                                .userId(user.getId())
                                .email(user.getEmail())
                                .role(user.getRole())
                                .message("Lawyer registered successfully. Please verify your email. Your account will be reviewed for verification.")
                                .pollingToken(user.getVerificationPollingToken())
                                .build();
        }

        @Transactional
        public RegisterResponse registerNGO(NGORegisterRequest request,
                        org.springframework.web.multipart.MultipartFile file1,
                        org.springframework.web.multipart.MultipartFile file2,
                        org.springframework.web.multipart.MultipartFile file3,
                        org.springframework.web.multipart.MultipartFile file4) throws java.io.IOException {
                // Check if email already exists
                if (userRepository.existsByEmail(request.getEmail())) {
                        throw new RuntimeException("Email already registered");
                }

                // Check if registration number already exists
                if (ngoRepository.existsByRegistrationNumber(request.getRegistrationNumber())) {
                        throw new RuntimeException("Registration number already registered");
                }

                // Create User
                User user = User.builder()
                                .email(request.getEmail())
                                .passwordHash(passwordEncoder.encode(request.getPassword()))
                                .role(UserRole.NGO)
                                .isEmailVerified(false)
                                .isActive(true)
                                .verificationPollingToken(UUID.randomUUID().toString())
                                .build();

                user = userRepository.save(user);

                // Create NGO profile
                NGO ngo = NGO.builder()
                                .user(user)
                                .organizationName(request.getOrganizationName())
                                .registrationNumber(request.getRegistrationNumber())
                                .registrationType(request.getRegistrationType())
                                .registrationYear(request.getRegistrationYear())
                                .registrationDate(request.getRegistrationDate())
                                .registeringAuthority(request.getRegisteringAuthority())
                                .panNumber(request.getPanNumber())
                                .contactPersonName(request.getContactPersonName())
                                .contactEmail(request.getContactEmail())
                                .contactPhone(request.getContactPhone())
                                .organizationPhone(request.getOrganizationPhone())
                                .contactPhone(request.getContactPhone())
                                .organizationPhone(request.getOrganizationPhone())
                                .organizationEmail(request.getOrganizationEmail())
                                .contactPersonDesignation(request.getContactPersonDesignation())
                                .proBonoCommitment(request.getProBonoCommitment())
                                .maxProBonoCases(request.getMaxProBonoCases())
                                .websiteUrl(request.getWebsiteUrl())
                                .description(request.getDescription())
                                .officeAddressLine1(request.getOfficeAddressLine1())
                                .officeAddressLine2(request.getOfficeAddressLine2())
                                .city(request.getCity())
                                .state(request.getState())
                                .pincode(request.getPincode())
                                .country(request.getCountry())
                                .latitude(request.getLatitude())
                                .longitude(request.getLongitude())
                                .serviceAreas(request.getAreasOfWork())
                                .isVerified(false)
                                .isActive(true)
                                .build();

                // Handle file uploads
                processNgoFile(file1, "REGISTRATION_CERTIFICATE", "NGO Registration Certificate", user, ngo);
                processNgoFile(file2, "DARPAN_CERTIFICATE", "NGO Darpan Certificate", user, ngo);
                processNgoFile(file3, "PAN_CARD", "NGO PAN Card", user, ngo);
                processNgoFile(file4, "ID_PROOF", "Representative ID Proof", user, ngo);

                ngoRepository.save(ngo);
                sendVerificationEmail(user);

                log.info("NGO registered successfully: {}", request.getEmail());

                return RegisterResponse.builder()
                                .userId(user.getId())
                                .email(user.getEmail())
                                .role(user.getRole())
                                .message("NGO registered successfully. Please verify your email. Your account will be reviewed for verification.")
                                .pollingToken(user.getVerificationPollingToken())
                                .build();
        }

        @Transactional
        public RegisterResponse registerAdmin(AdminRegisterRequest request) {
                // Check if email already exists
                if (userRepository.existsByEmail(request.getEmail())) {
                        throw new RuntimeException("Email already registered");
                }

                // Create User
                User user = User.builder()
                                .email(request.getEmail())
                                .passwordHash(passwordEncoder.encode(request.getPassword()))
                                .role(UserRole.ADMIN)
                                .isEmailVerified(true) // Admins are auto-verified
                                .isActive(true)
                                .build();

                user = userRepository.save(user);

                // Create Admin profile with default permissions
                HashMap<String, Object> defaultPermissions = new HashMap<>();
                defaultPermissions.put("manage_users", true);
                defaultPermissions.put("manage_verifications", true);
                defaultPermissions.put("view_reports", true);

                Admin admin = Admin.builder()
                                .user(user)
                                .firstName(request.getFirstName())
                                .lastName(request.getLastName())
                                .phoneNumber(request.getPhoneNumber())
                                .adminLevel(request.getAdminLevel())
                                .permissions(defaultPermissions)
                                .build();

                adminRepository.save(admin);

                log.info("Admin registered successfully: {}", request.getEmail());

                return RegisterResponse.builder()
                                .userId(user.getId())
                                .email(user.getEmail())
                                .role(user.getRole())
                                .message("Admin registered successfully.")
                                .build();
        }

        private void sendVerificationEmail(User user) {
                String token = UUID.randomUUID().toString();
                EmailVerificationToken verificationToken = EmailVerificationToken.builder()
                                .user(user)
                                .token(token)
                                .expiresAt(LocalDateTime.now().plusHours(24))
                                .isUsed(false)
                                .build();

                emailVerificationTokenRepository.save(verificationToken);
                emailService.sendVerificationEmail(user.getEmail(), token);
        }

        private void createVerificationRequest(User user, String documentUrl, String documentType) {
                com.jurify.jurify_backend.model.VerificationRequest request = com.jurify.jurify_backend.model.VerificationRequest
                                .builder()
                                .user(user)
                                .documentUrl(documentUrl)
                                .documentType(documentType)
                                .status(com.jurify.jurify_backend.model.enums.VerificationStatus.PENDING)
                                .build();

                verificationRequestRepository.save(request);
        }

        private void processNgoFile(org.springframework.web.multipart.MultipartFile file,
                        String category,
                        String verificationTypeDesc,
                        User user,
                        NGO ngo) {
                if (file != null && !file.isEmpty()) {
                        try {
                                String s3Key = r2Service.uploadFile(file,
                                                "ngos/" + user.getId() + "/documents/" + category);
                                String fileUrl = "https://jurify-storage.318a1e3b8170016e8898a857e83852a8.r2.cloudflarestorage.com/"
                                                + s3Key;

                                NGODocument document = NGODocument.builder()
                                                .ngo(ngo)
                                                .documentCategory(category)
                                                .fileName(file.getOriginalFilename())
                                                .fileType(file.getContentType())
                                                .s3Key(s3Key)
                                                .fileUrl(fileUrl)
                                                .build();

                                if (ngo.getDocuments() == null) {
                                        ngo.setDocuments(new ArrayList<>());
                                }
                                ngo.getDocuments().add(document);

                                // Create Verification Request for this document
                                createVerificationRequest(user, fileUrl, verificationTypeDesc);
                        } catch (java.io.IOException e) {
                                throw new RuntimeException("Failed to upload " + verificationTypeDesc, e);
                        }
                }
        }
}
