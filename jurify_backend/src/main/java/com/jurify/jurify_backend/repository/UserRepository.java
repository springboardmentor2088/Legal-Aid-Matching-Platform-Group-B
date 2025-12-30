package com.jurify.jurify_backend.repository;

import com.jurify.jurify_backend.model.User;
import com.jurify.jurify_backend.model.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<User> findByEmailAndRole(String email, UserRole role);

    Optional<User> findByVerificationPollingToken(String token);

    long countByRole(UserRole role);

    org.springframework.data.domain.Page<User> findByEmailNot(String email,
            org.springframework.data.domain.Pageable pageable);
}
