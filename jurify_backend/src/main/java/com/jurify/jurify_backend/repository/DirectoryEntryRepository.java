package com.jurify.jurify_backend.repository;

import com.jurify.jurify_backend.model.DirectoryEntry;
import com.jurify.jurify_backend.model.User;
import com.jurify.jurify_backend.model.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DirectoryEntryRepository extends JpaRepository<DirectoryEntry, Long> {

        @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM directory_entries d " +
                        "WHERE " +
                        "(CAST(:isVerified AS boolean) IS NULL OR d.is_verified = :isVerified) AND " +
                        "(CAST(:isActive AS boolean) IS NULL OR d.is_active = :isActive) AND " +
                        "(CAST(:role AS text) IS NULL OR d.role = :role) AND " +
                        "(CAST(:state AS text) IS NULL OR d.state = :state) AND " +
                        "(CAST(:city AS text) IS NULL OR d.city = :city) AND " +
                        "(CAST(:specialization AS text) IS NULL OR CAST(d.specialization AS TEXT) ILIKE CONCAT('%', :specialization, '%')) AND "
                        +
                        "(CAST(:minExp AS integer) IS NULL OR d.years_of_experience >= :minExp) AND " +
                        "(CAST(:maxExp AS integer) IS NULL OR d.years_of_experience <= :maxExp) AND " +
                        "(CAST(:minRating AS text) IS NULL OR CAST(d.rating AS double precision) >= CAST(:minRating AS double precision)) AND "
                        +
                        "(CAST(:maxRating AS text) IS NULL OR CAST(d.rating AS double precision) <= CAST(:maxRating AS double precision)) AND "
                        +
                        "(CAST(:languages AS text) IS NULL OR CAST(d.languages AS TEXT) ILIKE CONCAT('%', :languages, '%')) AND "
                        +
                        "(CAST(:search AS text) IS NULL OR " +
                        "CAST(d.display_name AS TEXT) ILIKE CONCAT('%', :search, '%') OR " +
                        "CAST(d.city AS TEXT) ILIKE CONCAT('%', :search, '%'))", countQuery = "SELECT count(*) FROM directory_entries d "
                                        +
                                        "WHERE " +
                                        "(CAST(:isVerified AS boolean) IS NULL OR d.is_verified = :isVerified) AND " +
                                        "(CAST(:isActive AS boolean) IS NULL OR d.is_active = :isActive) AND " +
                                        "(CAST(:role AS text) IS NULL OR d.role = :role) AND " +
                                        "(CAST(:state AS text) IS NULL OR d.state = :state) AND " +
                                        "(CAST(:city AS text) IS NULL OR d.city = :city) AND " +
                                        "(CAST(:specialization AS text) IS NULL OR CAST(d.specialization AS TEXT) ILIKE CONCAT('%', :specialization, '%')) AND "
                                        +
                                        "(CAST(:minExp AS integer) IS NULL OR d.years_of_experience >= :minExp) AND " +
                                        "(CAST(:maxExp AS integer) IS NULL OR d.years_of_experience <= :maxExp) AND " +
                                        "(CAST(:minRating AS text) IS NULL OR CAST(d.rating AS double precision) >= CAST(:minRating AS double precision)) AND "
                                        +
                                        "(CAST(:maxRating AS text) IS NULL OR CAST(d.rating AS double precision) <= CAST(:maxRating AS double precision)) AND "
                                        +
                                        "(CAST(:languages AS text) IS NULL OR CAST(d.languages AS TEXT) ILIKE CONCAT('%', :languages, '%')) AND "
                                        +
                                        "(CAST(:search AS text) IS NULL OR " +
                                        "CAST(d.display_name AS TEXT) ILIKE CONCAT('%', :search, '%') OR " +
                                        "CAST(d.city AS TEXT) ILIKE CONCAT('%', :search, '%'))", nativeQuery = true)
        org.springframework.data.domain.Page<DirectoryEntry> searchEntries(
                        @org.springframework.data.repository.query.Param("role") String role,
                        @org.springframework.data.repository.query.Param("state") String state,
                        @org.springframework.data.repository.query.Param("city") String city,
                        @org.springframework.data.repository.query.Param("specialization") String specialization,
                        @org.springframework.data.repository.query.Param("minExp") Integer minExp,
                        @org.springframework.data.repository.query.Param("maxExp") Integer maxExp,
                        @org.springframework.data.repository.query.Param("minRating") String minRating,
                        @org.springframework.data.repository.query.Param("maxRating") String maxRating,
                        @org.springframework.data.repository.query.Param("languages") String languages,
                        @org.springframework.data.repository.query.Param("search") String search,
                        @org.springframework.data.repository.query.Param("isActive") Boolean isActive,
                        @org.springframework.data.repository.query.Param("isVerified") Boolean isVerified,
                        org.springframework.data.domain.Pageable pageable);

        @org.springframework.data.jpa.repository.Query("SELECT d FROM DirectoryEntry d JOIN d.user u WHERE d.isActive = true AND u.lastLoginAt < :cutoffDate")
        List<DirectoryEntry> findInactiveEntries(
                        @org.springframework.data.repository.query.Param("cutoffDate") java.time.LocalDateTime cutoffDate);

        java.util.Optional<DirectoryEntry> findByUser(User user);
}
