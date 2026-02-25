package com.codegym.spring_boot.security;

import com.codegym.spring_boot.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Value("${app.oauth2.authorized-redirect-uris}")
    private String redirectUri;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");

        userRepository.findByEmail(email).ifPresentOrElse(
                user -> {
                    // Cũ -> Login thẳng
                    String token = jwtService.generateToken(user);
                    String targetUrl = UriComponentsBuilder.fromUriString(redirectUri)
                            .queryParam("token", token)
                            .build().toUriString();
                    try {
                        getRedirectStrategy().sendRedirect(request, response, targetUrl);
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                },
                () -> {
                    // Mới -> Redirect về trang Complete Profile
                    String regToken = jwtService.generateRegistrationToken(email);
                    String targetUrl = UriComponentsBuilder.fromUriString(redirectUri)
                            .queryParam("regToken", regToken)
                            .build().toUriString();
                    try {
                        getRedirectStrategy().sendRedirect(request, response, targetUrl);
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                });
    }
}
