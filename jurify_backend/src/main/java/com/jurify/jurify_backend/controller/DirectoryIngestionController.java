package com.jurify.jurify_backend.controller;

import com.jurify.jurify_backend.dto.directory.DirectoryIngestionDto;
import com.jurify.jurify_backend.model.User;
import com.jurify.jurify_backend.repository.UserRepository;
import com.jurify.jurify_backend.service.DirectoryEntryService;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/admin/directory")
@RequiredArgsConstructor
public class DirectoryIngestionController {

    private final DirectoryEntryService directoryEntryService;
    private final UserRepository userRepository;

    // ================= JSON UPLOAD =================

    @PostMapping("/upload/json")
    public ResponseEntity<String> uploadJson(
            @RequestBody List<DirectoryIngestionDto> dtos) {
        for (DirectoryIngestionDto dto : dtos) {
            User user = userRepository.findByEmail(dto.getUserEmail())
                    .orElseThrow(() -> new RuntimeException(
                            "User not found: " + dto.getUserEmail()));

            directoryEntryService.createDirectoryEntryFromIngestionDto(dto, user);
        }

        return ResponseEntity.ok("Directory JSON uploaded successfully");
    }

    // ================= CSV UPLOAD =================

    @PostMapping("/upload/csv")
    public ResponseEntity<String> uploadCsv(
            @RequestParam("file") MultipartFile file) {
        try (
                Reader reader = new InputStreamReader(
                        file.getInputStream(),
                        StandardCharsets.UTF_8);
                CSVParser csvParser = new CSVParser(
                        reader,
                        CSVFormat.DEFAULT
                                .withFirstRecordAsHeader()
                                .withIgnoreHeaderCase()
                                .withTrim())) {
            for (CSVRecord record : csvParser) {

                User user = userRepository.findByEmail(record.get("userEmail"))
                        .orElseThrow(() -> new RuntimeException(
                                "User not found: " + record.get("userEmail")));

                DirectoryIngestionDto dto = new DirectoryIngestionDto();
                dto.setUserEmail(record.get("userEmail"));
                dto.setRole(Enum.valueOf(
                        com.jurify.jurify_backend.model.enums.UserRole.class,
                        record.get("role").toUpperCase()));
                dto.setDisplayName(record.get("displayName"));
                dto.setPhoneNumber(record.get("phoneNumber"));
                dto.setCity(record.get("city"));
                dto.setState(record.get("state"));
                dto.setCountry(record.get("country"));
                dto.setDescription(record.get("description"));

                directoryEntryService.createDirectoryEntryFromIngestionDto(dto, user);
            }

            return ResponseEntity.ok("Directory CSV uploaded successfully");

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("CSV upload failed");
        }
    }
}
