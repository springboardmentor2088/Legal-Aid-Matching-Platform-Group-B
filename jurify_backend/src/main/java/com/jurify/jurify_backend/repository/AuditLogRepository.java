package com.jurify.jurify_backend.repository;

import com.jurify.jurify_backend.model.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    Page<AuditLog> findByAdminId(Long adminId, Pageable pageable);

    Page<AuditLog> findByTargetUserId(Long targetUserId, Pageable pageable);

    Page<AuditLog> findByAction(String action, Pageable pageable);

    List<AuditLog> findByTimestampBetween(LocalDateTime start, LocalDateTime end);

    Page<AuditLog> findAllByOrderByTimestampDesc(Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT a FROM AuditLog a LEFT JOIN FETCH a.admin ORDER BY a.timestamp DESC")
    Page<AuditLog> findAllWithAdmin(Pageable pageable);

    @org.springframework.data.jpa.repository.Query(value = "SELECT a FROM AuditLog a LEFT JOIN a.admin u WHERE " +
            "(a.timestamp >= :startDate) AND " +
            "(a.timestamp <= :endDate) AND " +
            "(:action = '' OR a.action = :action) AND " +
            "(:role IS NULL OR u.role = :role) " +
            "ORDER BY a.timestamp DESC", countQuery = "SELECT COUNT(a) FROM AuditLog a LEFT JOIN a.admin u WHERE " +
                    "(a.timestamp >= :startDate) AND " +
                    "(a.timestamp <= :endDate) AND " +
                    "(:action = '' OR a.action = :action) AND " +
                    "(:role IS NULL OR u.role = :role)")
    Page<AuditLog> findWithFilters(
            @org.springframework.data.repository.query.Param("startDate") LocalDateTime startDate,
            @org.springframework.data.repository.query.Param("endDate") LocalDateTime endDate,
            @org.springframework.data.repository.query.Param("action") String action,
            @org.springframework.data.repository.query.Param("role") com.jurify.jurify_backend.model.enums.UserRole role,
            Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT a.action FROM AuditLog a ORDER BY a.action")
    List<String> findDistinctActions();
}
