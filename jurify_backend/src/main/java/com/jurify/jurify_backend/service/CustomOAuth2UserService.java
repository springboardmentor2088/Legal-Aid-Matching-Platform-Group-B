package com.jurify.jurify_backend.service;

import com.jurify.jurify_backend.model.Citizen;
import com.jurify.jurify_backend.model.OAuthAccount;
import com.jurify.jurify_backend.model.User;
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

        String email = ((String) oAuth2User.getAttribute("email")).toLowerCase();
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
                System.out.println("User NOT found. Proceeding to role selection flow via success handler.");
                // We do NOT create the user here anymore.
                // The SuccessHandler will detect that the user doesn't exist in the DB
                // and redirect to the role selection page.
            }
        }

        return oAuth2User;
    }
}
