package com.jurify.jurify_backend.repository;

import com.jurify.jurify_backend.model.CitizenDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CitizenDocumentRepository extends JpaRepository<CitizenDocument, Long> {
}
