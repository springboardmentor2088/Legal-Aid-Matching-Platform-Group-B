package com.jurify.jurify_backend.repository;

import com.jurify.jurify_backend.model.Lawyer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LawyerRepository extends JpaRepository<Lawyer, Long> {
    Optional<Lawyer> findByUser_Id(Long userId);

    boolean existsByBarCouncilNumber(String barCouncilNumber);

    java.util.List<Lawyer> findByIsVerifiedTrue();

    java.util.List<Lawyer> findByStateAndIsVerifiedTrue(String state);

    java.util.List<Lawyer> findByState(String state);
}
