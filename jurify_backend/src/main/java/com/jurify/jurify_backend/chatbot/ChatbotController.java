package com.jurify.jurify_backend.chatbot;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/public/chatbot")
@CrossOrigin(origins = "http://localhost:5173")
public class ChatbotController {

    private final RestTemplate restTemplate = new RestTemplate();
    private final String RAG_SERVICE_URL = "http://localhost:8001/rag/chat";

    @PostMapping("/chat")
    public ResponseEntity<Map<String, Object>> chat(@RequestBody Map<String, String> request) {
        String message = request.get("message");
        String role = request.get("role");

        if (message == null || message.trim().isEmpty()) {
             Map<String, Object> errorResponse = new HashMap<>();
             errorResponse.put("reply", "Please enter a message.");
             return ResponseEntity.badRequest().body(errorResponse);
        }

        try {
            // Forward to Python RAG Service
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, String> ragRequest = new HashMap<>();
            ragRequest.put("message", message);
            if (role != null) {
                ragRequest.put("role", role);
            }

            HttpEntity<Map<String, String>> entity = new HttpEntity<>(ragRequest, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(RAG_SERVICE_URL, entity, Map.class);
            Map<String, Object> body = response.getBody();

            String reply = "I'm sorry, I couldn't find an answer.";
            if (body != null && body.containsKey("answer")) {
                reply = (String) body.get("answer");
            }
           

            Map<String, Object> finalResponse = new HashMap<>();
            finalResponse.put("reply", reply); 
            
            return ResponseEntity.ok(finalResponse);

        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("reply", "Service is currently unavailable. Please try again later.");
            return ResponseEntity.status(503).body(errorResponse);
        }
    }
}
