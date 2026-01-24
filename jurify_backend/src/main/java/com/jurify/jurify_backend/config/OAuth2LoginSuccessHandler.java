package com.jurify.jurify_backend.config;

import com.jurify.jurify_backend.repository.UserRepository;
import com.jurify.jurify_backend.util.JwtUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

        private final JwtUtil jwtUtil;
        private final UserRepository userRepository;

        @Override
        public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                        Authentication authentication) throws IOException, ServletException {
                OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
                String email = ((String) oAuth2User.getAttribute("email")).toLowerCase();
                String name = oAuth2User.getAttribute("name");
                // Normalize provider ID extraction if possible, strict dependence on "sub"
                // might be Google specific.
                // For now, "sub" acts as the unique ID for Google.
                String providerId = oAuth2User.getAttribute("sub");

                System.out.println("SuccessHandler: Only checking existence for email: " + email);

                userRepository.findByEmail(email).ifPresentOrElse(user -> {
                        // User Exists - Standard Login Flow
                        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getEmail(),
                                        user.getRole().name());
                        String refreshToken = jwtUtil.generateRefreshToken(user.getId(), user.getEmail());

                        String targetUrl = UriComponentsBuilder.fromUriString("http://localhost:5173/oauth2/redirect")
                                        .queryParam("accessToken", accessToken)
                                        .queryParam("refreshToken", refreshToken)
                                        .build().toUriString();

                        try {
                                getRedirectStrategy().sendRedirect(request, response, targetUrl);
                        } catch (IOException e) {
                                throw new RuntimeException(e);
                        }
                }, () -> {
                        // User Not Found - Redirect to Role Selection
                        System.out.println("User not found. Redirecting to Role Selection.");
                        String preRegToken = jwtUtil.generatePreRegistrationToken(email, name, providerId);

                        String targetUrl = UriComponentsBuilder.fromUriString("http://localhost:5173/role-selection")
                                        .queryParam("token", preRegToken)
                                        .queryParam("email", email)
                                        .queryParam("name", name)
                                        .build().toUriString();

                        try {
                                getRedirectStrategy().sendRedirect(request, response, targetUrl);
                        } catch (IOException e) {
                                throw new RuntimeException(e);
                        }
                });
        }
}
