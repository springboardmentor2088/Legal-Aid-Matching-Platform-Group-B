package com.jurify.jurify_backend.repository;

import com.jurify.jurify_backend.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByLawyerId(Long lawyerId);

    List<Review> findByNgoId(Long ngoId);

    void deleteByLegalCaseId(Long caseId);
}
