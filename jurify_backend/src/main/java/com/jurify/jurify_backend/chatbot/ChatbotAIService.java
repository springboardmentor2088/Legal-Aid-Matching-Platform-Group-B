package com.jurify.jurify_backend.chatbot;

import org.springframework.stereotype.Service;

@Service
public class ChatbotAIService {

    private final OpenAIClient openAIClient;

    public ChatbotAIService(OpenAIClient openAIClient) {
        this.openAIClient = openAIClient;
    }

    public String generateReply(String userMessage, String role) {
        String systemPrompt = "You are Jurify Assistant — a legal aid platform helper bot.\n" +
                "\n" +
                "Only answer questions related to:\n" +
                "- Case submission\n" +
                "- User verification\n" +
                "- Appointments and schedules\n" +
                "- Dashboards and analytics\n" +
                "- Platform roles (Citizen, Lawyer, NGO, Admin)\n" +
                "- Reports and audit logs\n" +
                "\n" +
                "Rules:\n" +
                "- Do NOT provide legal advice\n" +
                "- Do NOT answer unrelated questions\n" +
                "- Be short and practical\n" +
                "- Guide users to platform features only\n" +
                "- If unsure, say: \"Please contact support.\"\n" +
                "\n" +
                "Tone: professional, friendly, supportive.";

        String contextMessage = "User Role: " + role + "\n" + "User Question: " + userMessage;
        
        return openAIClient.getChatCompletion(systemPrompt, contextMessage);
    }
}
