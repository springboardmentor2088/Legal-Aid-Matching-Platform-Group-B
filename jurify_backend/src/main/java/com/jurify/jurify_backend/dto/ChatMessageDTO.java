package com.jurify.jurify_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageDTO {
    private Long id;
    private Long caseId;
    private String senderId;
    private String receiverId;
    private String content;
    @com.fasterxml.jackson.annotation.JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;
    private String attachmentUrl;
    private String attachmentKey;
    private String attachmentType;
    private String attachmentName;
    private Long attachmentSize;
    private Boolean isRead;
    private String onlineStatus;
}
