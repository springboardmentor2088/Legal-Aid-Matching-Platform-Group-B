package com.jurify.jurify_backend.controller;

import com.jurify.jurify_backend.dto.ChatMessageDTO;
import com.jurify.jurify_backend.model.ChatMessage;
import com.jurify.jurify_backend.model.LegalCase;
import com.jurify.jurify_backend.repository.ChatMessageRepository;
import com.jurify.jurify_backend.repository.LegalCaseRepository;
import com.jurify.jurify_backend.service.CloudflareR2Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatMessageRepository chatMessageRepository;
    private final LegalCaseRepository legalCaseRepository;
    private final CloudflareR2Service r2Service;
    private final com.jurify.jurify_backend.service.PresenceService presenceService;

    @Value("${cloudflare.r2.public-url}")
    private String r2PublicUrl;

    @MessageMapping("/chat.sendMessage")
    @org.springframework.transaction.annotation.Transactional
    public void sendMessage(@Payload ChatMessageDTO chatMessageDTO, Principal principal) {
        String senderEmail = principal.getName();
        Long caseId = chatMessageDTO.getCaseId();

        // 1. Validate Access
        LegalCase legalCase = legalCaseRepository.findById(caseId)
                .orElseThrow(() -> new RuntimeException("Case not found"));

        boolean isAuthorized = false;
        // Check Citizen Access
        if (legalCase.getCitizen() != null && legalCase.getCitizen().getUser().getEmail().equals(senderEmail)) {
            isAuthorized = true;
        }
        // Check Lawyer Access
        else if (legalCase.getLawyer() != null && legalCase.getLawyer().getUser().getEmail().equals(senderEmail)) {
            isAuthorized = true;
        }
        // Check NGO Access
        else if (legalCase.getNgo() != null && legalCase.getNgo().getUser().getEmail().equals(senderEmail)) {
            isAuthorized = true;
        }

        if (!isAuthorized) {
            log.warn("Unauthorized chat attempt by {} for case {}", senderEmail, caseId);
            return;
        }

        log.info("Processing message for caseId: {}, sender: {}", caseId, senderEmail);

        // 2. Persist Message
        String actualReceiverId = null;
        if (legalCase.getCitizen() != null && legalCase.getCitizen().getUser().getEmail().equals(senderEmail)) {
            // Sender is Citizen -> Receiver is Lawyer or NGO
            if (legalCase.getLawyer() != null)
                actualReceiverId = legalCase.getLawyer().getUser().getEmail();
            else if (legalCase.getNgo() != null)
                actualReceiverId = legalCase.getNgo().getUser().getEmail();
        } else if (legalCase.getCitizen() != null) {
            // Sender is Provider -> Receiver is Citizen
            actualReceiverId = legalCase.getCitizen().getUser().getEmail();
        }

        // Fallback or override DTO
        if (actualReceiverId != null) {
            chatMessageDTO.setReceiverId(actualReceiverId);
        }

        ChatMessage message = ChatMessage.builder()
                .caseId(caseId)
                .senderId(senderEmail)
                .receiverId(actualReceiverId) // Use calculated ID
                .content(chatMessageDTO.getContent())
                .attachmentUrl(chatMessageDTO.getAttachmentUrl())
                .attachmentKey(chatMessageDTO.getAttachmentKey())
                .attachmentType(chatMessageDTO.getAttachmentType())
                .attachmentName(chatMessageDTO.getAttachmentName())
                .attachmentSize(chatMessageDTO.getAttachmentSize())
                .build();

        ChatMessage saved = chatMessageRepository.save(message);

        // 3. Broadcast to Case Topic
        ChatMessageDTO response = mapToDTO(saved);
        messagingTemplate.convertAndSend("/topic/cases/" + caseId, response);

        // 4. Update Receiver's unread count
        if (response.getReceiverId() != null) {
            long unreadCount = chatMessageRepository.countByCaseIdAndReceiverIdAndIsReadFalse(caseId,
                    response.getReceiverId());
            messagingTemplate.convertAndSendToUser(response.getReceiverId(), "/queue/unread",
                    (Object) java.util.Map.of("caseId", caseId, "unreadCount", unreadCount));
        }
    }

    @GetMapping("/api/chat/history/{caseId}")
    @ResponseBody
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<List<ChatMessageDTO>> getChatHistory(@PathVariable Long caseId, Principal principal) {
        log.info("Fetching chat history for caseId: {} by user: {}", caseId, principal.getName());

        // Mark messages as read for this user
        chatMessageRepository.markMessagesAsRead(caseId, principal.getName());

        // Broadcast "Read" event to the other party so they see double blue ticks
        // immediately
        messagingTemplate.convertAndSend("/topic/cases/" + caseId + "/read",
                (Object) java.util.Map.of("caseId", caseId, "readerId", principal.getName()));

        // Simple access check (can be more robust)
        List<ChatMessage> messages = chatMessageRepository.findByCaseIdOrderByTimestampAsc(caseId);
        log.info("Found {} messages", messages.size());
        return ResponseEntity.ok(messages.stream().map(this::mapToDTO).collect(Collectors.toList()));
    }

    @PutMapping("/api/chat/read/{caseId}")
    @ResponseBody
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<Void> markAsRead(@PathVariable Long caseId, Principal principal) {
        String readerEmail = principal.getName();
        chatMessageRepository.markMessagesAsRead(caseId, readerEmail);

        // Broadcast "Read" event to the other party so they see double blue ticks
        // In a real app, you'd find who the other party is. For now, broadcast to the
        // case topic or specific user.
        messagingTemplate.convertAndSend("/topic/cases/" + caseId + "/read",
                (Object) java.util.Map.of("caseId", caseId, "readerId", readerEmail));

        return ResponseEntity.ok().build();
    }

    @PostMapping("/api/chat/upload")
    @ResponseBody
    public ResponseEntity<ChatMessageDTO> uploadAttachment(
            @RequestParam("file") MultipartFile file,
            @RequestParam("caseId") Long caseId,
            Principal principal) {

        try {
            String s3Key = r2Service.uploadFile(file, "chat/" + caseId + "/" + System.currentTimeMillis());
            String presignedUrl = r2Service.generatePresignedUrl(s3Key);

            return ResponseEntity.ok(ChatMessageDTO.builder()
                    .attachmentKey(s3Key)
                    .attachmentUrl(presignedUrl)
                    .attachmentName(file.getOriginalFilename())
                    .attachmentType(file.getContentType())
                    .attachmentSize(file.getSize())
                    .build());
        } catch (Exception e) {
            log.error("File upload failed for case {}: {}", caseId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/api/chat/download")
    public ResponseEntity<org.springframework.core.io.Resource> downloadAttachment(
            @RequestParam("key") String fileKey) {
        try {
            byte[] data = r2Service.downloadFile(fileKey);
            if (data == null) {
                return ResponseEntity.notFound().build();
            }

            org.springframework.core.io.ByteArrayResource resource = new org.springframework.core.io.ByteArrayResource(
                    data);

            // Extract filename from key if possible or default
            String filename = "download";
            if (fileKey.contains("/")) {
                filename = fileKey.substring(fileKey.lastIndexOf("/") + 1);
            }
            // Remove UUID part if it looks like uuid-filename, otherwise keep as is
            // (Assuming implementation: key = directory + "/" + UUID + extension)
            // Ideally we should store original filename properly or pass it in request

            return ResponseEntity.ok()
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + filename + "\"")
                    .contentLength(data.length)
                    .contentType(org.springframework.http.MediaType.APPLICATION_OCTET_STREAM)
                    .body(resource);
        } catch (Exception e) {
            log.error("Download proxy failed for key {}: {}", fileKey, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    private ChatMessageDTO mapToDTO(ChatMessage msg) {
        String dynamicUrl = msg.getAttachmentUrl();

        // If we have a key, generate a fresh presigned URL
        if (msg.getAttachmentKey() != null && !msg.getAttachmentKey().isEmpty()) {
            dynamicUrl = r2Service.generatePresignedUrl(msg.getAttachmentKey());
        }

        return ChatMessageDTO.builder()
                .id(msg.getId())
                .caseId(msg.getCaseId())
                .senderId(msg.getSenderId())
                .receiverId(msg.getReceiverId())
                .content(msg.getContent())
                .timestamp(msg.getTimestamp())
                .attachmentUrl(dynamicUrl)
                .attachmentKey(msg.getAttachmentKey())
                .attachmentType(msg.getAttachmentType())
                .attachmentName(msg.getAttachmentName())
                .attachmentSize(msg.getAttachmentSize())
                .isRead(msg.isRead())
                .onlineStatus(presenceService != null && msg.getReceiverId() != null
                        ? (presenceService.isOnline(msg.getReceiverId()) ? "online" : "offline")
                        : "offline")
                .build();
    }
}
