package com.jurify.jurify_backend.repository;

import com.jurify.jurify_backend.model.Citizen;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CitizenRepository extends JpaRepository<Citizen, Long> {
    Optional<Citizen> findByUser_Id(Long userId);
}

