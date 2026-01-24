package com.jurify.jurify_backend.service;

import com.jurify.jurify_backend.model.CaseReport;
import com.jurify.jurify_backend.model.LegalCase;
import com.jurify.jurify_backend.model.Notification;
import com.jurify.jurify_backend.model.User;
import com.jurify.jurify_backend.model.enums.UserRole;
import com.jurify.jurify_backend.repository.CaseReportRepository;
import com.jurify.jurify_backend.repository.LegalCaseRepository;
import com.jurify.jurify_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CaseReportService {

        private final CaseReportRepository caseReportRepository;
        private final LegalCaseRepository legalCaseRepository;
        private final UserRepository userRepository;
        private final NotificationService notificationService;
        private final LegalCaseService legalCaseService;
        private final AuditLogService auditLogService;
        private final EmailService emailService;

        @Transactional
        public CaseReport reportCase(Long caseId, Long reporterId, String reason) {
                User reporter = userRepository.findById(reporterId)
                                .orElseThrow(() -> new RuntimeException("Reporter not found"));

                LegalCase legalCase = legalCaseRepository.findById(caseId)
                                .orElseThrow(() -> new RuntimeException("Case not found"));

                CaseReport report = CaseReport.builder()
                                .caseId(caseId)
                                .reporterId(reporterId)
                                .reporterRole(reporter.getRole().name())
                                .reason(reason)
                                .status(CaseReport.ReportStatus.PENDING)
                                .caseTitle(legalCase.getTitle())
                                .caseOwnerEmail(legalCase.getCitizen().getUser().getEmail())
                                .build();

                CaseReport savedReport = caseReportRepository.save(report);

                // Audit Log for Report Creation
                auditLogService.logSystemAction("CASE_REPORTED", reporterId, "REPORT", savedReport.getId(),
                                "Case reported ID " + caseId + " for reason: " + reason);

                // Notify Admins
                List<User> admins = userRepository.findByRole(UserRole.ADMIN);
                for (User admin : admins) {
                        Notification notification = Notification.builder()
                                        .userId(admin.getId())
                                        .title("New Case Report")
                                        .message("A case has been reported by " + reporter.getRole() + ": "
                                                        + legalCase.getTitle())
                                        .type(com.jurify.jurify_backend.model.enums.NotificationType.CASE)
                                        .read(false)
                                        .createdAt(LocalDateTime.now())
                                        .build();
                        notificationService.createNotification(notification);
                }

                return savedReport;
        }

        public List<CaseReport> getPendingReports() {
                return caseReportRepository.findByStatus(CaseReport.ReportStatus.PENDING);
        }

        public List<CaseReport> getAllReports() {
                return caseReportRepository.findAll();
        }

        @Transactional
        public void dismissReport(Long reportId, Long adminId) {
                CaseReport report = caseReportRepository.findById(reportId)
                                .orElseThrow(() -> new RuntimeException("Report not found"));
                report.setStatus(CaseReport.ReportStatus.DISMISSED);
                caseReportRepository.save(report);

                // Audit Log for Dismissal
                auditLogService.logAction("CASE_REPORT_DISMISSED", adminId, "REPORT", reportId,
                                "Case report ID " + reportId + " dismissed.", "System");
        }

        @Transactional
        public void resolveReportAndRemoveCase(Long reportId, String removalReason, Long adminId) {
                CaseReport report = caseReportRepository.findById(reportId)
                                .orElseThrow(() -> new RuntimeException("Report not found"));

                LegalCase legalCase = legalCaseRepository.findById(report.getCaseId())
                                .orElseThrow(() -> new RuntimeException("Case not found"));

                Long citizenUserId = legalCase.getCitizen().getUser().getId();
                String citizenEmail = legalCase.getCitizen().getUser().getEmail();
                String caseTitle = legalCase.getTitle();

                // Soft Delete the case (Mark as REMOVED)
                legalCaseService.markCaseAsRemoved(report.getCaseId());

                // Update Report Status
                report.setStatus(CaseReport.ReportStatus.RESOLVED);
                caseReportRepository.save(report);

                // Audit Log for Removal
                if (adminId != null) {
                        auditLogService.logAction("CASE_REMOVED", adminId, "CASE", report.getCaseId(),
                                        "Case '" + caseTitle + "' (ID: " + report.getCaseId()
                                                        + ") removed by admin resolution. Reason: " + removalReason,
                                        "System");
                } else {
                        // Fallback if adminId missing
                        auditLogService.logSystemAction("CASE_REMOVED", citizenUserId, "CASE", report.getCaseId(),
                                        "Case '" + caseTitle + "' removed. Reason: " + removalReason);
                }

                // Notify Citizen (Internal)
                Notification notification = Notification.builder()
                                .userId(citizenUserId)
                                .title("Case Removed")
                                .message("Your case '" + caseTitle + "' has been removed. Reason: " + removalReason)
                                .type(com.jurify.jurify_backend.model.enums.NotificationType.CASE)
                                .read(false)
                                .createdAt(LocalDateTime.now())
                                .build();
                notificationService.createNotification(notification);

                // Send Email to Citizen
                try {
                        emailService.sendGeneralEmail(
                                        citizenEmail,
                                        "Important: Your Case Has Been Removed - Jurify",
                                        "Case Removed: " + caseTitle,
                                        "We are writing to inform you that your case '" + caseTitle
                                                        + "' has been removed from Jurify following a review of a report against it.<br><br><strong>Reason:</strong> "
                                                        + removalReason
                                                        + "<br><br>If you believe this decision was made in error, please contact our support team.",
                                        "Contact Support",
                                        "http://localhost:5173/contact");
                } catch (Exception e) {
                        System.err.println("Failed to send case removal email: " + e.getMessage());
                }
        }
}
