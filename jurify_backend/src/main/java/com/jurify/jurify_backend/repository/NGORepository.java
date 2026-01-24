package com.jurify.jurify_backend.repository;

import com.jurify.jurify_backend.model.NGO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NGORepository extends JpaRepository<NGO, Long> {
    Optional<NGO> findByUser_Id(Long userId);

    boolean existsByRegistrationNumber(String registrationNumber);

    java.util.List<NGO> findByIsVerifiedTrue();

    java.util.List<NGO> findByStateAndIsVerifiedTrue(String state);

    java.util.List<NGO> findByState(String state);
}
