package com.jurify.jurify_backend.service;

import com.jurify.jurify_backend.model.Citizen;
import com.jurify.jurify_backend.model.Location;
import com.jurify.jurify_backend.model.OAuthAccount;
import com.jurify.jurify_backend.model.User;
import com.jurify.jurify_backend.model.enums.UserRole;
import com.jurify.jurify_backend.repository.CitizenRepository;
import com.jurify.jurify_backend.repository.OAuthAccountRepository;
import com.jurify.jurify_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final OAuthAccountRepository oauthAccountRepository;
    private final CitizenRepository citizenRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        System.out.println("CustomOAuth2UserService: Loading user...");
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String providerName = userRequest.getClientRegistration().getRegistrationId().toUpperCase();
        System.out.println("Provider: " + providerName);

        String email = oAuth2User.getAttribute("email");
        System.out.println("Email: " + email);

        com.jurify.jurify_backend.model.enums.Provider provider = com.jurify.jurify_backend.model.enums.Provider
                .valueOf(providerName);

        String providerId = oAuth2User.getAttribute("sub");
        String firstName = oAuth2User.getAttribute("given_name");
        String lastName = oAuth2User.getAttribute("family_name");

        Optional<OAuthAccount> oAuthAccount = oauthAccountRepository.findByProviderAndProviderAccountId(provider,
                providerId);

        User user;
        if (oAuthAccount.isPresent()) {
            System.out.println("OAuth Account found.");
            user = oAuthAccount.get().getUser();
            // Update existing user/profile if needed
            if (user.getRole() == com.jurify.jurify_backend.model.enums.UserRole.CITIZEN && user.getCitizen() != null) {
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
            // Check if user exists by email
            Optional<User> existingUser = userRepository.findByEmail(email);
            if (existingUser.isPresent()) {
                System.out.println("User found by email.");
                user = existingUser.get();
                // If user exists but no OAuth account, we link it.
                // We typically do NOT overwrite profile data for existing email-based accounts
                // unless verified/requested.
                // But for now, let's leave it safe.
            } else {
                System.out.println("Creating NEW user.");
                // Register new user as Citizen
                user = User.builder()
                        .email(email)
                        .passwordHash("") // No password for OAuth users
                        .role(com.jurify.jurify_backend.model.enums.UserRole.CITIZEN)
                        .isEmailVerified(true) // OAuth email is verified
                        .isActive(true)
                        .build();
                user = userRepository.save(user);
                System.out.println("User saved with ID: " + user.getId());

                Location location = Location.builder().country("IN").build();
                Citizen citizen = Citizen.builder()
                        .user(user)
                        .firstName(firstName)
                        .lastName(lastName)
                        .location(location)
                        .build();
                citizenRepository.save(citizen);
            }

            // Link OAuth Account
            OAuthAccount newOAuthAccount = OAuthAccount.builder()
                    .user(user)
                    .provider(provider)
                    .providerAccountId(providerId)
                    .build();
            oauthAccountRepository.save(newOAuthAccount);
            System.out.println("OAuth Account linked.");
        }

        return oAuth2User;
    }
}
