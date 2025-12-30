package com.jurify.jurify_backend.dto.directory;

import com.jurify.jurify_backend.model.enums.UserRole;
import lombok.Data;

@Data
public class DirectoryIngestionDto {

    private String userEmail;
    private UserRole role;

    private String displayName;
    private String phoneNumber;

    private String city;
    private String state;
    private String country;

    private String description;
}
