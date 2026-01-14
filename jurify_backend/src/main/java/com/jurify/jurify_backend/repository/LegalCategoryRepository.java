package com.jurify.jurify_backend.repository;

import com.jurify.jurify_backend.model.LegalCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LegalCategoryRepository extends JpaRepository<LegalCategory, Long> {
    Optional<LegalCategory> findByName(String name);

    java.util.List<LegalCategory> findByIsActiveTrueOrderByDisplayOrderAsc();
}
