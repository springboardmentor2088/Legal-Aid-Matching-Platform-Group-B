package com.jurify.jurify_backend.repository;

import com.jurify.jurify_backend.model.Consultation;
import com.jurify.jurify_backend.model.LegalCase;
import com.jurify.jurify_backend.model.enums.ConsultationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConsultationRepository extends JpaRepository<Consultation, Long> {
    List<Consultation> findByProviderIdAndProviderType(Long providerId, String providerType);

    List<Consultation> findByLegalCase(LegalCase legalCase);

    Optional<Consultation> findByLegalCaseAndProviderIdAndProviderType(LegalCase legalCase, Long providerId,
            String providerType);

    List<Consultation> findByProviderIdAndProviderTypeAndStatus(Long providerId, String providerType,
            ConsultationStatus status);
}
