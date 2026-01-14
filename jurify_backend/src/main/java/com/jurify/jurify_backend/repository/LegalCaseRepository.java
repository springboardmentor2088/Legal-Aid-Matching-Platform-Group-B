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

    List<LegalCase> findByLawyerId(Long lawyerId);

    Long countByLawyerIdAndStatus(Long lawyerId, CaseStatus status);

    Long countByLawyerId(Long lawyerId);

    List<LegalCase> findByNgoId(Long ngoId);

    Long countByNgoIdAndStatus(Long ngoId, CaseStatus status);

    Long countByNgoId(Long ngoId);

    List<LegalCase> findByStatus(CaseStatus status);

    List<LegalCase> findByStatusAndLocationState(CaseStatus status, String state);
}
