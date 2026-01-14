package com.jurify.jurify_backend.config;

import com.jurify.jurify_backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.Collections;
import java.util.List;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
@Slf4j
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtUtil jwtUtil;
    private final com.jurify.jurify_backend.service.PresenceService presenceService;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/user", "/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String authHeader = accessor.getFirstNativeHeader("Authorization");

                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        String token = authHeader.substring(7);
                        try {
                            if (jwtUtil.validateToken(token)) {
                                String username = jwtUtil.extractUsername(token);
                                String role = jwtUtil.extractRole(token);

                                List<GrantedAuthority> authorities = Collections
                                        .singletonList(new SimpleGrantedAuthority(role));
                                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                                        username, null, authorities);

                                accessor.setUser(auth);
                                presenceService.markOnline(username);
                                log.info("WebSocket Authenticated User: {} (marked ONLINE)", username);
                            }
                        } catch (Exception e) {
                            log.error("WebSocket Authentication Failed: {}", e.getMessage());
                        }
                    }
                } else if (StompCommand.DISCONNECT.equals(accessor.getCommand())) {
                    if (accessor.getUser() != null) {
                        String username = accessor.getUser().getName();
                        presenceService.markOffline(username);
                        log.info("WebSocket User DISCONNECTED: {} (marked OFFLINE)", username);
                    }
                }
                return message;
            }
        });
    }
}
