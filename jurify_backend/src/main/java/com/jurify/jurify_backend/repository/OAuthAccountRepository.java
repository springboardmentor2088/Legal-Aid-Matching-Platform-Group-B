package com.jurify.jurify_backend.repository;

import com.jurify.jurify_backend.model.OAuthAccount;
import com.jurify.jurify_backend.model.enums.Provider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OAuthAccountRepository extends JpaRepository<OAuthAccount, Long> {
    Optional<OAuthAccount> findByProviderAndProviderAccountId(Provider provider, String providerAccountId);

    Optional<OAuthAccount> findByUser_IdAndProvider(Long userId, Provider provider);

    Optional<OAuthAccount> findByUserIdAndProvider(Long userId, Provider provider);
}
