package com.jurify.jurify_backend.config;

import com.jurify.jurify_backend.model.User;
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
                String email = oAuth2User.getAttribute("email");
                System.out.println("SuccessHandler: Looking for user with email: " + email);

                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("User not found after OAuth login"));

                String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());
                String refreshToken = jwtUtil.generateRefreshToken(user.getId(), user.getEmail());

                String targetUrl = UriComponentsBuilder.fromUriString("http://localhost:5173/oauth2/redirect")
                                .queryParam("accessToken", accessToken)
                                .queryParam("refreshToken", refreshToken)
                                .build().toUriString();

                getRedirectStrategy().sendRedirect(request, response, targetUrl);
        }
}
