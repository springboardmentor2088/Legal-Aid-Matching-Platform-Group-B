package com.jurify.jurify_backend.repository;

import com.jurify.jurify_backend.model.CaseReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CaseReportRepository extends JpaRepository<CaseReport, Long> {
    List<CaseReport> findByStatus(CaseReport.ReportStatus status);

    List<CaseReport> findByCaseId(Long caseId);
}
