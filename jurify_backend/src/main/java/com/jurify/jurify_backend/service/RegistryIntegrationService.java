package com.jurify.jurify_backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RegistryIntegrationService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final String REGISTRY_API_URL = "https://jurify-registry-api-production-4bb9.up.railway.app/api";

    public Map<String, Object> verifyLawyer(String enrollmentNumber) {
        try {
            String url = REGISTRY_API_URL + "/lawyer-references?enrollmentNumber=" + enrollmentNumber;
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            // Log error or handle gracefully
            System.err.println("Error verifying lawyer: " + e.getMessage());
        }
        return Map.of("exists", false);
    }

    public Map<String, Object> verifyNgo(String registrationNumber) {
        try {
            String url = REGISTRY_API_URL + "/ngo-references?registrationNumber=" + registrationNumber;
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            // Log error or handle gracefully
            System.err.println("Error verifying NGO: " + e.getMessage());
        }
        return Map.of("exists", false);
    }
}
