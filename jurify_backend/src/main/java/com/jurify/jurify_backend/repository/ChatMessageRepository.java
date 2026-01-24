package com.jurify.jurify_backend.repository;

import com.jurify.jurify_backend.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByCaseIdOrderByTimestampAsc(Long caseId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE ChatMessage m SET m.isRead = true WHERE m.caseId = :caseId AND m.receiverId = :receiverId AND m.isRead = false")
    void markMessagesAsRead(Long caseId, String receiverId);

    long countByCaseIdAndReceiverIdAndIsReadFalse(Long caseId, String receiverId);

    boolean existsByCaseId(Long caseId);

    void deleteByCaseId(Long caseId);
}
