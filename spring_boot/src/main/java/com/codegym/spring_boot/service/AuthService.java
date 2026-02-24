package com.codegym.spring_boot.service;

import com.codegym.spring_boot.dto.auth.request.LoginRequest;
import com.codegym.spring_boot.dto.auth.request.RegisterRequest;
import com.codegym.spring_boot.dto.auth.response.AuthResponse;
import com.codegym.spring_boot.entity.Profile;
import com.codegym.spring_boot.entity.User;
import com.codegym.spring_boot.entity.enums.UserRole;
import com.codegym.spring_boot.repository.UserRepository;
import com.codegym.spring_boot.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

        private final UserRepository userRepository;
        private final PasswordEncoder passwordEncoder;
        private final JwtService jwtService;
        private final AuthenticationManager authenticationManager;

        @Transactional
        public AuthResponse register(RegisterRequest request) {
                if (userRepository.existsByUsername(request.getUsername())) {
                        throw new RuntimeException("Username already exists");
                }
                if (userRepository.existsByEmail(request.getEmail())) {
                        throw new RuntimeException("Email already exists");
                }

                User user = User.builder()
                                .username(request.getUsername())
                                .email(request.getEmail())
                                .password(passwordEncoder.encode(request.getPassword()))
                                .role(UserRole.user)
                                .globalRating(1500)
                                .build();

                Profile profile = new Profile();
                profile.setUser(user);
                user.setProfile(profile);

                userRepository.save(user);

                String jwtToken = jwtService.generateToken(user);

                return AuthResponse.builder()
                                .token(jwtToken)
                                .id(user.getId())
                                .username(user.getUsername())
                                .email(user.getEmail())
                                .role(user.getRole().name())
                                .build();
        }

        public AuthResponse authenticate(LoginRequest request) {
                authenticationManager.authenticate(
                                new UsernamePasswordAuthenticationToken(
                                                request.getUsername(),
                                                request.getPassword()));

                User user = userRepository.findByUsernameAndIsDeletedFalse(request.getUsername())
                                .orElseThrow();

                String jwtToken = jwtService.generateToken(user);

                return AuthResponse.builder()
                                .token(jwtToken)
                                .id(user.getId())
                                .username(user.getUsername())
                                .email(user.getEmail())
                                .role(user.getRole().name())
                                .build();
        }
}
