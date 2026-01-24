package com.jurify.jurify_backend.filter;

import com.jurify.jurify_backend.service.RateLimitingService;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.PrintWriter;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RateLimitFilterTest {

    @Mock
    private RateLimitingService rateLimitingService;

    @Mock
    private FilterChain filterChain;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @InjectMocks
    private RateLimitFilter rateLimitFilter;

    @Test
    void doFilterInternal_AuthEndpoint_ShouldCheckLimit() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/auth/login");
        when(request.getRemoteAddr()).thenReturn("127.0.0.1");

        Bucket bucket = mock(Bucket.class);
        ConsumptionProbe probe = mock(ConsumptionProbe.class);
        when(rateLimitingService.resolveBucket(anyString())).thenReturn(bucket);
        when(bucket.tryConsumeAndReturnRemaining(1)).thenReturn(probe);
        when(probe.isConsumed()).thenReturn(true);
        when(probe.getRemainingTokens()).thenReturn(10L);

        rateLimitFilter.doFilterInternal(request, response, filterChain);

        verify(rateLimitingService).resolveBucket(anyString());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilterInternal_CasePost_ShouldCheckLimit() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/cases/submit");
        when(request.getMethod()).thenReturn("POST");
        when(request.getRemoteAddr()).thenReturn("127.0.0.1");

        Bucket bucket = mock(Bucket.class);
        ConsumptionProbe probe = mock(ConsumptionProbe.class);
        when(rateLimitingService.resolveBucket(anyString())).thenReturn(bucket);
        when(bucket.tryConsumeAndReturnRemaining(1)).thenReturn(probe);
        when(probe.isConsumed()).thenReturn(true);

        rateLimitFilter.doFilterInternal(request, response, filterChain);

        verify(rateLimitingService).resolveBucket(anyString());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilterInternal_CaseGet_ShouldNotCheckLimit() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/cases/123");
        when(request.getMethod()).thenReturn("GET");

        rateLimitFilter.doFilterInternal(request, response, filterChain);

        verify(rateLimitingService, never()).resolveBucket(anyString());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilterInternal_LimitExceeded_ShouldReturn429() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/auth/login");
        when(request.getRemoteAddr()).thenReturn("127.0.0.1");

        Bucket bucket = mock(Bucket.class);
        ConsumptionProbe probe = mock(ConsumptionProbe.class);
        when(rateLimitingService.resolveBucket(anyString())).thenReturn(bucket);
        when(bucket.tryConsumeAndReturnRemaining(1)).thenReturn(probe);
        when(probe.isConsumed()).thenReturn(false); // Limited

        when(response.getWriter()).thenReturn(mock(PrintWriter.class));

        rateLimitFilter.doFilterInternal(request, response, filterChain);

        verify(response).setStatus(429);
        verify(filterChain, never()).doFilter(request, response);
    }
}
