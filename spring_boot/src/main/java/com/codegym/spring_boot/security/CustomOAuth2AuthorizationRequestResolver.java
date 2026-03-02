package com.codegym.spring_boot.security;

import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;
import java.util.function.Consumer;

@Component
public class CustomOAuth2AuthorizationRequestResolver implements OAuth2AuthorizationRequestResolver {

    private final DefaultOAuth2AuthorizationRequestResolver defaultResolver;

    public CustomOAuth2AuthorizationRequestResolver(ClientRegistrationRepository clientRegistrationRepository) {
        this.defaultResolver = new DefaultOAuth2AuthorizationRequestResolver(
                clientRegistrationRepository, "/oauth2/authorization");
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request) {
        OAuth2AuthorizationRequest req = defaultResolver.resolve(request);
        return customizeAuthorizationRequest(request, req);
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request, String clientRegistrationId) {
        OAuth2AuthorizationRequest req = defaultResolver.resolve(request, clientRegistrationId);
        return customizeAuthorizationRequest(request, req);
    }

    private OAuth2AuthorizationRequest customizeAuthorizationRequest(HttpServletRequest request,
            OAuth2AuthorizationRequest req) {
        if (req == null) {
            return null;
        }

        // Dynamically build the base URL from the incoming request (e.g. from Ngrok)
        String scheme = request.getHeader("X-Forwarded-Proto") != null ? request.getHeader("X-Forwarded-Proto") : request.getScheme();
        String host = request.getHeader("X-Forwarded-Host") != null ? request.getHeader("X-Forwarded-Host") : request.getServerName();
        int port = request.getServerPort();
        
        // If it's ngrok or forwarded, usually don't need port unless it's explicitly forwarded
        String portStr = (port == 80 || port == 443 || request.getHeader("X-Forwarded-Host") != null) ? "" : ":" + port;
        String baseUrl = scheme + "://" + host + portStr;

        String customRedirectUri = baseUrl + "/login/oauth2/code/" + req.getAttribute("registration_id");

        return OAuth2AuthorizationRequest.from(req)
                .redirectUri(customRedirectUri)
                .build();
    }
}
