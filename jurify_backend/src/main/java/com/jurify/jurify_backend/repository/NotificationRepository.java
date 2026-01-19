package com.jurify.jurify_backend.repository;

import com.jurify.jurify_backend.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Notification> findByUserIdAndReadOrderByCreatedAtDesc(Long userId, Boolean read);

    Long countByUserIdAndReadFalse(Long userId);

    void deleteByUserIdAndIdIn(Long userId, List<Long> ids);
}
