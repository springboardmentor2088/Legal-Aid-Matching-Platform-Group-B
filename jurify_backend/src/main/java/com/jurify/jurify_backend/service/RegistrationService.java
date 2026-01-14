package com.jurify.jurify_backend.service;

import com.jurify.jurify_backend.dto.registration.*;
import java.util.List;
import com.jurify.jurify_backend.model.*;
import com.jurify.jurify_backend.model.enums.UserRole;
import com.jurify.jurify_backend.model.enums.Provider;
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

        private final RegistryIntegrationService registryIntegrationService;

        private final DirectoryEntryService directoryEntryService;

        private final LegalCategoryRepository legalCategoryRepository;
        private final com.jurify.jurify_backend.util.JwtUtil jwtUtil;
        private final OAuthAccountRepository oAuthAccountRepository;

        @Transactional
        public RegisterResponse registerCitizen(CitizenRegisterRequest request,
                        org.springframework.web.multipart.MultipartFile file) throws java.io.IOException {
                // Check if email already exists
                if (userRepository.existsByEmail(request.getEmail())) {
                        throw new RuntimeException("Email already registered");
                }

                // Create User
                User user;
                if (request.getPreRegistrationToken() != null && !request.getPreRegistrationToken().isEmpty()) {
                        // Google Auth Registration
                        if (!jwtUtil.validateToken(request.getPreRegistrationToken())) {
                                throw new RuntimeException("Invalid or expired pre-registration token");
                        }
                        String tokenEmail = jwtUtil.extractUsername(request.getPreRegistrationToken()); // Extracts
                                                                                                        // email
                        if (!tokenEmail.equals(request.getEmail())) {
                                throw new RuntimeException("Token email does not match request email");
                        }

                        user = User.builder()
                                        .email(request.getEmail())
                                        .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString())) // Random
                                                                                                            // password
                                        .role(UserRole.CITIZEN)
                                        .isEmailVerified(true) // Email verified by Google
                                        .isActive(true)
                                        .verificationPollingToken(UUID.randomUUID().toString())
                                        .build();

                        user = userRepository.save(user);

                        // Link OAuth Account
                        String providerId = jwtUtil.extractClaim(request.getPreRegistrationToken(),
                                        claims -> claims.get("providerId", String.class));
                        if (providerId != null) {
                                OAuthAccount oAuthAccount = OAuthAccount.builder()
                                                .user(user)
                                                .provider(Provider.GOOGLE)
                                                .providerAccountId(providerId)
                                                .build();
                                oAuthAccountRepository.save(oAuthAccount);
                        }
                } else

                {
                        // Regular Registration
                        if (request.getPassword() == null || request.getPassword().length() < 8) {
                                throw new RuntimeException("Password must be at least 8 characters");
                        }
                        user = User.builder()
                                        .email(request.getEmail())
                                        .passwordHash(passwordEncoder.encode(request.getPassword()))
                                        .role(UserRole.CITIZEN)
                                        .isEmailVerified(false)
                                        .isActive(true)
                                        .verificationPollingToken(UUID.randomUUID().toString())
                                        .build();
                        user = userRepository.save(user);
                }

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
                                .languages(request.getLanguages())
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
                User user;
                if (request.getPreRegistrationToken() != null && !request.getPreRegistrationToken().isEmpty()) {
                        // Google Auth Registration
                        if (!jwtUtil.validateToken(request.getPreRegistrationToken())) {
                                throw new RuntimeException("Invalid or expired pre-registration token");
                        }
                        String tokenEmail = jwtUtil.extractUsername(request.getPreRegistrationToken()); // Extracts
                                                                                                        // email
                        if (!tokenEmail.equals(request.getEmail())) {
                                throw new RuntimeException("Token email does not match request email");
                        }

                        user = User.builder()
                                        .email(request.getEmail())
                                        .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString())) // Random
                                                                                                            // password
                                        .role(UserRole.LAWYER)
                                        .isEmailVerified(true) // Email verified by Google
                                        .isActive(true)
                                        .verificationPollingToken(UUID.randomUUID().toString())
                                        .build();

                        try {
                                user = userRepository.save(user);
                        } catch (org.springframework.dao.DataIntegrityViolationException e) {
                                throw new RuntimeException("Email already registered");
                        }

                        // Link OAuth Account
                        String providerId = jwtUtil.extractClaim(request.getPreRegistrationToken(),
                                        claims -> claims.get("providerId", String.class));
                        if (providerId != null) {
                                OAuthAccount oAuthAccount = OAuthAccount.builder()
                                                .user(user)
                                                .provider(Provider.GOOGLE)
                                                .providerAccountId(providerId)
                                                .build();
                                oAuthAccountRepository.save(oAuthAccount);
                        }
                } else {
                        // Regular Registration
                        if (request.getPassword() == null || request.getPassword().length() < 8) {
                                throw new RuntimeException("Password must be at least 8 characters");
                        }
                        user = User.builder()
                                        .email(request.getEmail())
                                        .passwordHash(passwordEncoder.encode(request.getPassword()))
                                        .role(UserRole.LAWYER)
                                        .isEmailVerified(false)
                                        .isActive(true)
                                        .verificationPollingToken(UUID.randomUUID().toString())
                                        .build();
                        try {
                                user = userRepository.save(user);
                        } catch (org.springframework.dao.DataIntegrityViolationException e) {
                                throw new RuntimeException("Email already registered");
                        }
                }

                // Auto-Verify Check
                boolean isAutoVerified = false;
                java.util.Map<String, Object> registryData = registryIntegrationService
                                .verifyLawyer(request.getBarCouncilNumber());
                if (registryData != null && Boolean.TRUE.equals(registryData.get("exists"))) {
                        isAutoVerified = true;
                        log.info("Auto-verified lawyer: {}", request.getEmail());
                }

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
                                .longitude(request.getLongitude())
                                .isVerified(isAutoVerified) // Set based on registry check
                                .verificationStatus(isAutoVerified
                                                ? com.jurify.jurify_backend.model.enums.VerificationStatus.VERIFIED
                                                : com.jurify.jurify_backend.model.enums.VerificationStatus.PENDING)
                                .isAvailable(true)
                                .build();

                // Handle Case Types (Specializations)
                if (request.getCaseTypes() != null && !request.getCaseTypes().isEmpty()) {
                        List<LawyerSpecialization> specializations = new ArrayList<>();
                        for (String caseType : request.getCaseTypes()) {
                                LegalCategory category = legalCategoryRepository.findByName(caseType)
                                                .orElseGet(() -> legalCategoryRepository.save(LegalCategory.builder()
                                                                .name(caseType)
                                                                // .description("Automatically created during
                                                                // registration")
                                                                .build()));

                                LawyerSpecialization spec = LawyerSpecialization.builder()
                                                .lawyer(lawyer)
                                                .legalCategory(category)
                                                .yearsOfExperience(request.getYearsOfExperience()) // Assuming total exp
                                                                                                   // applies to all for
                                                                                                   // now
                                                .isPrimary(false)
                                                .build();
                                specializations.add(spec);
                        }
                        lawyer.setSpecializations(specializations);
                }

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

                        // AUTOMATICALLY CREATE VERIFICATION REQUEST (Only if not already verified)
                        if (!isAutoVerified) {
                                createVerificationRequest(user, fileUrl, "Lawyer ID Card");
                        } else {
                                // If auto-verified, we can maybe mark the request as APPROVED immediately or
                                // skip creating one.
                                // For record keeping, lets create one as APPROVED.
                                com.jurify.jurify_backend.model.VerificationRequest req = com.jurify.jurify_backend.model.VerificationRequest
                                                .builder()
                                                .user(user)
                                                .documentUrl(fileUrl)
                                                .documentType("Lawyer ID Card (Auto-Verified)")
                                                .status(com.jurify.jurify_backend.model.enums.VerificationStatus.VERIFIED)
                                                .build();
                                verificationRequestRepository.save(req);
                        }
                }

                lawyerRepository.save(lawyer);
                directoryEntryService.createLawyerEntry(
                                user,
                                lawyer.getFirstName() + " " + lawyer.getLastName(),
                                lawyer.getPhoneNumber(),
                                lawyer.getCity(),
                                lawyer.getState(),
                                lawyer.getCountry(),
                                lawyer.getBio(),
                                isAutoVerified); // Pass verification status

                sendVerificationEmail(user);

                log.info("Lawyer registered successfully: {}", request.getEmail());

                return RegisterResponse.builder()
                                .userId(user.getId())
                                .email(user.getEmail())
                                .role(user.getRole())
                                .message(isAutoVerified ? "Lawyer registered and verified via Registry."
                                                : "Lawyer registered successfully. Please verify your email. Your account will be reviewed for verification.")
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
                User user;
                if (request.getPreRegistrationToken() != null && !request.getPreRegistrationToken().isEmpty()) {
                        // Google Auth Registration
                        if (!jwtUtil.validateToken(request.getPreRegistrationToken())) {
                                throw new RuntimeException("Invalid or expired pre-registration token");
                        }
                        String tokenEmail = jwtUtil.extractUsername(request.getPreRegistrationToken()); // Extracts
                                                                                                        // email
                        if (!tokenEmail.equals(request.getEmail())) {
                                throw new RuntimeException("Token email does not match request email");
                        }

                        user = User.builder()
                                        .email(request.getEmail())
                                        .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString())) // Random
                                                                                                            // password
                                        .role(UserRole.NGO)
                                        .isEmailVerified(true) // Email verified by Google
                                        .isActive(true)
                                        .verificationPollingToken(UUID.randomUUID().toString())
                                        .build();

                        user = userRepository.save(user);

                        // Link OAuth Account
                        String providerId = jwtUtil.extractClaim(request.getPreRegistrationToken(),
                                        claims -> claims.get("providerId", String.class));
                        if (providerId != null) {
                                OAuthAccount oAuthAccount = OAuthAccount.builder()
                                                .user(user)
                                                .provider(Provider.GOOGLE)
                                                .providerAccountId(providerId)
                                                .build();
                                oAuthAccountRepository.save(oAuthAccount);
                        }
                } else {
                        // Regular Registration
                        if (request.getPassword() == null || request.getPassword().length() < 8) {
                                throw new RuntimeException("Password must be at least 8 characters");
                        }
                        user = User.builder()
                                        .email(request.getEmail())
                                        .passwordHash(passwordEncoder.encode(request.getPassword()))
                                        .role(UserRole.NGO)
                                        .isEmailVerified(false)
                                        .isActive(true)
                                        .verificationPollingToken(UUID.randomUUID().toString())
                                        .build();
                        user = userRepository.save(user);
                }

                // Auto-Verify Check
                boolean isAutoVerified = false;
                java.util.Map<String, Object> registryData = registryIntegrationService
                                .verifyNgo(request.getRegistrationNumber());
                if (registryData != null && Boolean.TRUE.equals(registryData.get("exists"))) {
                        isAutoVerified = true;
                        log.info("Auto-verified NGO: {}", request.getEmail());
                }

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
                                .languages(request.getLanguages())
                                .isVerified(isAutoVerified) // Set based on registry check
                                .verificationStatus(isAutoVerified
                                                ? com.jurify.jurify_backend.model.enums.VerificationStatus.VERIFIED
                                                : com.jurify.jurify_backend.model.enums.VerificationStatus.PENDING)
                                .isActive(true)
                                .build();

                // Handle Areas of Work (Specializations)
                if (request.getAreasOfWork() != null && !request.getAreasOfWork().isEmpty()) {
                        List<NGOSpecialization> specializations = new ArrayList<>();
                        for (String area : request.getAreasOfWork()) {
                                LegalCategory category = legalCategoryRepository.findByName(area)
                                                .orElseGet(() -> legalCategoryRepository.save(LegalCategory.builder()
                                                                .name(area)
                                                                .build()));

                                NGOSpecialization spec = NGOSpecialization.builder()
                                                .ngo(ngo)
                                                .legalCategory(category)
                                                // .description("Automatically created during registration")
                                                .build();
                                specializations.add(spec);
                        }
                        ngo.setSpecializations(specializations);
                }

                // Handle file uploads
                processNgoFile(file1, "REGISTRATION_CERTIFICATE", "NGO Registration Certificate", user, ngo,
                                isAutoVerified);
                processNgoFile(file2, "DARPAN_CERTIFICATE", "NGO Darpan Certificate", user, ngo, isAutoVerified);
                processNgoFile(file3, "PAN_CARD", "NGO PAN Card", user, ngo, isAutoVerified);
                processNgoFile(file4, "ID_PROOF", "Representative ID Proof", user, ngo, isAutoVerified);

                ngoRepository.save(ngo);
                directoryEntryService.createNgoEntry(
                                user,
                                ngo.getOrganizationName(),
                                ngo.getOrganizationPhone(),
                                ngo.getCity(),
                                ngo.getState(),
                                ngo.getCountry(),
                                ngo.getDescription(),
                                isAutoVerified); // Pass verification status

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
                        NGO ngo,
                        boolean isVerified) {
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
                                if (!isVerified) {
                                        createVerificationRequest(user, fileUrl, verificationTypeDesc);
                                } else {
                                        // If auto-verified, create APPROVED/VERIFIED request for record
                                        com.jurify.jurify_backend.model.VerificationRequest req = com.jurify.jurify_backend.model.VerificationRequest
                                                        .builder()
                                                        .user(user)
                                                        .documentUrl(fileUrl)
                                                        .documentType(verificationTypeDesc + " (Auto-Verified)")
                                                        .status(com.jurify.jurify_backend.model.enums.VerificationStatus.VERIFIED)
                                                        .build();
                                        verificationRequestRepository.save(req);
                                }
                        } catch (java.io.IOException e) {
                                throw new RuntimeException("Failed to upload " + verificationTypeDesc, e);
                        }
                }
        }
}
