package com.jurify.jurify_backend.repository;

import com.jurify.jurify_backend.model.CaseDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CaseDocumentRepository extends JpaRepository<CaseDocument, Long> {
}
