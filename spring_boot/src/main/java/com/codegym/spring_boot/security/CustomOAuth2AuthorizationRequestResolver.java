package com.codegym.spring_boot.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;

@Component
public class CustomOAuth2AuthorizationRequestResolver implements OAuth2AuthorizationRequestResolver {

    private final DefaultOAuth2AuthorizationRequestResolver defaultResolver;

    @Value("${app.ngrok.url}")
    private String ngrokUrl;

    public CustomOAuth2AuthorizationRequestResolver(ClientRegistrationRepository clientRegistrationRepository) {
        this.defaultResolver = new DefaultOAuth2AuthorizationRequestResolver(
                clientRegistrationRepository, "/oauth2/authorization");
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request) {
        OAuth2AuthorizationRequest req = defaultResolver.resolve(request);
        return customizeAuthorizationRequest(req);
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request, String clientRegistrationId) {
        OAuth2AuthorizationRequest req = defaultResolver.resolve(request, clientRegistrationId);
        return customizeAuthorizationRequest(req);
    }

    private OAuth2AuthorizationRequest customizeAuthorizationRequest(OAuth2AuthorizationRequest req) {
        if (req == null) {
            return null;
        }

        // Use the explicit Ngrok URL from properties to build the redirect URI
        // Fallback to removing trailing slash if user added it
        String cleanNgrokUrl = ngrokUrl.endsWith("/") ? ngrokUrl.substring(0, ngrokUrl.length() - 1) : ngrokUrl;
        String customRedirectUri = cleanNgrokUrl + "/login/oauth2/code/" + req.getAttribute("registration_id");

        System.out.println("DEBUG OAUTH2 REDIRECT URI: " + customRedirectUri);

        return OAuth2AuthorizationRequest.from(req)
                .redirectUri(customRedirectUri)
                .build();
    }
}
