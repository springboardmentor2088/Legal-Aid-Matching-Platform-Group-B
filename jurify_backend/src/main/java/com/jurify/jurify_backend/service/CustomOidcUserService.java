package com.jurify.jurify_backend.service;

import com.jurify.jurify_backend.model.Citizen;
import com.jurify.jurify_backend.model.OAuthAccount;
import com.jurify.jurify_backend.model.User;
import com.jurify.jurify_backend.model.enums.UserRole;
import com.jurify.jurify_backend.repository.CitizenRepository;
import com.jurify.jurify_backend.repository.OAuthAccountRepository;
import com.jurify.jurify_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CustomOidcUserService extends OidcUserService {

    private final UserRepository userRepository;
    private final OAuthAccountRepository oauthAccountRepository;
    private final CitizenRepository citizenRepository;

    @Override
    @Transactional
    public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        System.out.println("CustomOidcUserService: Loading user...");
        OidcUser oidcUser = super.loadUser(userRequest);

        String providerName = userRequest.getClientRegistration().getRegistrationId().toUpperCase();
        System.out.println("Provider: " + providerName);

        String email = oidcUser.getEmail();
        System.out.println("Email: " + email);

        com.jurify.jurify_backend.model.enums.Provider provider = com.jurify.jurify_backend.model.enums.Provider
                .valueOf(providerName);

        // OIDC uses 'sub' as the unique ID
        String providerId = oidcUser.getSubject();
        String firstName = oidcUser.getGivenName();
        String lastName = oidcUser.getFamilyName();

        if (firstName == null)
            firstName = "User";
        if (lastName == null)
            lastName = "";

        Optional<OAuthAccount> oAuthAccount = oauthAccountRepository.findByProviderAndProviderAccountId(provider,
                providerId);

        User user;
        if (oAuthAccount.isPresent()) {
            System.out.println("OAuth Account found.");
            user = oAuthAccount.get().getUser();

            // Update profile
            if (user.getRole() == UserRole.CITIZEN && user.getCitizen() != null) {
                Citizen citizen = user.getCitizen();
                boolean changed = false;
                if (firstName != null && !firstName.equals(citizen.getFirstName())) {
                    citizen.setFirstName(firstName);
                    changed = true;
                }
                if (lastName != null && !lastName.equals(citizen.getLastName())) {
                    citizen.setLastName(lastName);
                    changed = true;
                }
                if (changed) {
                    citizenRepository.save(citizen);
                }
            }
        } else {
            System.out.println("OAuth Account NOT found. Checking by email...");
            Optional<User> existingUser = userRepository.findByEmail(email);
            if (existingUser.isPresent()) {
                System.out.println("User found by email.");
                user = existingUser.get();
            } else {
                System.out.println("User NOT found. Proceeding to role selection flow via success handler.");
            }
        }

        return oidcUser;
    }
}
