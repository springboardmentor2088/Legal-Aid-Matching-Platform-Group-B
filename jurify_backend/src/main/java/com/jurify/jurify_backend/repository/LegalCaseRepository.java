package com.jurify.jurify_backend.repository;

import com.jurify.jurify_backend.model.LegalCase;
import com.jurify.jurify_backend.model.enums.CaseStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LegalCaseRepository extends JpaRepository<LegalCase, Long> {
    List<LegalCase> findByCitizenId(Long citizenId);

    Long countByCitizenIdAndStatus(Long citizenId, CaseStatus status);

    Long countByCitizenId(Long citizenId);

    long countByStatus(CaseStatus status);
}
