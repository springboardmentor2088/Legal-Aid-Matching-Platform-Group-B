package com.jurify.jurify_backend.repository;

import com.jurify.jurify_backend.model.VerificationRequest;
import com.jurify.jurify_backend.model.enums.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VerificationRequestRepository extends JpaRepository<VerificationRequest, Long> {
    List<VerificationRequest> findByStatus(VerificationStatus status);

    Optional<VerificationRequest> findByUserIdAndStatus(Long userId, VerificationStatus status);

    List<VerificationRequest> findByUserId(Long userId);

    long countByStatus(VerificationStatus status);
}
