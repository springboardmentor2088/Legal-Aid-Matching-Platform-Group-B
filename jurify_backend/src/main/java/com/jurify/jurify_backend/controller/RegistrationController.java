package com.jurify.jurify_backend.controller;

import com.jurify.jurify_backend.dto.registration.*;
import com.jurify.jurify_backend.service.RegistrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/register")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class RegistrationController {

    private final RegistrationService registrationService;

    @PostMapping(value = "/citizen", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<RegisterResponse> registerCitizen(
            @RequestPart("data") @Valid CitizenRegisterRequest request,
            @RequestPart("file") org.springframework.web.multipart.MultipartFile file) {
        try {
            RegisterResponse response = registrationService.registerCitizen(request, file);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException | java.io.IOException e) {
            log.error("Citizen registration failed for email: {}", request.getEmail(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(RegisterResponse.builder()
                            .message(e.getMessage())
                            .build());
        }
    }

    @PostMapping(value = "/lawyer", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<RegisterResponse> registerLawyer(
            @RequestPart("data") @Valid LawyerRegisterRequest request,
            @RequestPart("file") org.springframework.web.multipart.MultipartFile file) {
        try {
            RegisterResponse response = registrationService.registerLawyer(request, file);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException | java.io.IOException e) {
            log.error("Lawyer registration failed for email: {}", request.getEmail(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(RegisterResponse.builder()
                            .message(e.getMessage())
                            .build());
        }
    }

    @PostMapping(value = "/ngo", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<RegisterResponse> registerNGO(
            @RequestPart("data") @Valid NGORegisterRequest request,
            @RequestPart(value = "regCertificate", required = false) org.springframework.web.multipart.MultipartFile regCertificate,
            @RequestPart(value = "darpanCertificate", required = false) org.springframework.web.multipart.MultipartFile darpanCertificate,
            @RequestPart(value = "ngoPan", required = false) org.springframework.web.multipart.MultipartFile ngoPan,
            @RequestPart(value = "repIdProof", required = false) org.springframework.web.multipart.MultipartFile repIdProof) {
        try {
            RegisterResponse response = registrationService.registerNGO(request, regCertificate, darpanCertificate,
                    ngoPan, repIdProof);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException | java.io.IOException e) {
            log.error("NGO registration failed for email: {}", request.getEmail(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(RegisterResponse.builder()
                            .message(e.getMessage())
                            .build());
        }
    }

    @PostMapping("/admin")
    public ResponseEntity<RegisterResponse> registerAdmin(
            @Valid @RequestBody AdminRegisterRequest request) {
        try {
            RegisterResponse response = registrationService.registerAdmin(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            log.error("Admin registration failed for email: {}", request.getEmail(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(RegisterResponse.builder()
                            .message(e.getMessage())
                            .build());
        }
    }
}
