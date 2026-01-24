package com.jurify.jurify_backend.repository;

import com.jurify.jurify_backend.model.User;
import com.jurify.jurify_backend.model.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
        Optional<User> findByEmail(String email);

        boolean existsByEmail(String email);

        List<User> findByRole(UserRole role);

        Optional<User> findByEmailAndRole(String email, UserRole role);

        Optional<User> findByVerificationPollingToken(String token);

        long countByRole(UserRole role);

        @org.springframework.data.jpa.repository.Query(value = "SELECT u FROM User u LEFT JOIN FETCH u.citizen LEFT JOIN FETCH u.lawyer LEFT JOIN FETCH u.ngo WHERE u.email <> :email", countQuery = "SELECT count(u) FROM User u WHERE u.email <> :email")
        org.springframework.data.domain.Page<User> findAllExceptAdmin(
                        @org.springframework.data.repository.query.Param("email") String email,
                        org.springframework.data.domain.Pageable pageable);

        @org.springframework.data.jpa.repository.Query(value = "SELECT u FROM User u LEFT JOIN FETCH u.citizen LEFT JOIN FETCH u.lawyer LEFT JOIN FETCH u.ngo WHERE lower(u.email) LIKE lower(concat('%', :search, '%'))", countQuery = "SELECT count(u) FROM User u WHERE lower(u.email) LIKE lower(concat('%', :search, '%'))")
        org.springframework.data.domain.Page<User> searchByEmail(
                        @org.springframework.data.repository.query.Param("search") String search,
                        org.springframework.data.domain.Pageable pageable);
}
