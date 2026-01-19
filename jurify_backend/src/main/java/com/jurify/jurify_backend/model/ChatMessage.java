package com.jurify.jurify_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages", indexes = {
        @Index(name = "idx_chat_case_id", columnList = "case_id"),
        @Index(name = "idx_chat_timestamp", columnList = "timestamp")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "case_id", nullable = false)
    private Long caseId;

    @Column(name = "sender_id", nullable = false)
    private String senderId; // Email or UserID

    @Column(name = "receiver_id")
    private String receiverId; // Can be null for group/case broadcast

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "attachment_url", columnDefinition = "TEXT", length = 5000)
    private String attachmentUrl;

    @Column(name = "attachment_key", columnDefinition = "TEXT", length = 5000)
    private String attachmentKey;

    @Column(name = "attachment_type", columnDefinition = "TEXT", length = 2000)
    private String attachmentType;

    @Column(name = "attachment_name", columnDefinition = "TEXT", length = 2000)
    private String attachmentName;

    @Column(name = "attachment_size")
    private Long attachmentSize;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;

    @Column(name = "is_read")
    @Builder.Default
    private boolean isRead = false;
}
