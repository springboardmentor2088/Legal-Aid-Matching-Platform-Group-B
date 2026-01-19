package com.jurify.jurify_backend.repository;

import com.jurify.jurify_backend.model.CaseMatch;
import com.jurify.jurify_backend.model.LegalCase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CaseMatchRepository extends JpaRepository<CaseMatch, Long> {
    List<CaseMatch> findByLegalCaseOrderByMatchScoreDesc(LegalCase legalCase);

    List<CaseMatch> findByLegalCaseIdOrderByMatchScoreDesc(Long caseId);

    void deleteByLegalCase(LegalCase legalCase);

    List<CaseMatch> findByLegalCase(LegalCase legalCase);

    java.util.Optional<CaseMatch> findByLegalCaseAndProviderIdAndProviderType(LegalCase legalCase, Long providerId,
            String providerType);

    List<CaseMatch> findByProviderIdAndProviderType(Long providerId, String providerType);
}
