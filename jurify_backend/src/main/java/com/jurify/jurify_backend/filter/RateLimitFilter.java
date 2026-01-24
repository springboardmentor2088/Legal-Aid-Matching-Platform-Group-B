package com.jurify.jurify_backend.filter;

import com.jurify.jurify_backend.service.RateLimitingService;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    @Autowired
    private RateLimitingService rateLimitingService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Only apply to /api/auth endpoints for now to prevent brute force
        boolean isAuth = request.getRequestURI().startsWith("/api/auth");
        // Apply to case submission to prevent spam
        boolean isCaseSubmission = request.getRequestURI().startsWith("/api/cases")
                && "POST".equalsIgnoreCase(request.getMethod());

        if (isAuth || isCaseSubmission) {
            String ip = request.getRemoteAddr();
            // Use X-Forwarded-For if behind proxy (e.g. Cloudflare, Nginx)
            String xForwardedFor = request.getHeader("X-Forwarded-For");
            if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
                ip = xForwardedFor.split(",")[0].trim();
            }

            Bucket bucket = rateLimitingService.resolveBucket(ip);
            ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

            if (!probe.isConsumed()) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.getWriter().write("Too many requests. Please try again later.");
                return;
            }

            // Add remaining tokens header
            response.addHeader("X-Rate-Limit-Remaining", String.valueOf(probe.getRemainingTokens()));
        }

        filterChain.doFilter(request, response);
    }
}
