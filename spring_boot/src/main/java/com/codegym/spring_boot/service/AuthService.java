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
        private final com.codegym.spring_boot.repository.OtpRepository otpRepository;
        private final EmailService emailService;

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
                                .fullName(request.getFullName())
                                .email(request.getEmail())
                                .password(passwordEncoder.encode(request.getPassword()))
                                .role(UserRole.user)
                                .globalRating(0)
                                .build();

                Profile profile = new Profile();
                profile.setUser(user);
                user.setProfile(profile);

                userRepository.save(user);

                String jwtToken = jwtService.generateToken(user);

                emailService.sendWelcomeEmail(user.getEmail(), user.getFullName());

                return AuthResponse.builder()
                                .token(jwtToken)
                                .id(user.getId())
                                .username(user.getUsername())
                                .fullName(user.getFullName())
                                .email(user.getEmail())
                                .role(user.getRole().name())
                                .avatarUrl(user.getProfile() != null ? user.getProfile().getAvatarUrl() : null)
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
                                .fullName(user.getFullName())
                                .email(user.getEmail())
                                .role(user.getRole().name())
                                .avatarUrl(user.getProfile() != null ? user.getProfile().getAvatarUrl() : null)
                                .build();
        }

        @Transactional
        public AuthResponse completeOauth2Profile(
                        com.codegym.spring_boot.dto.auth.request.CompleteProfileRequest request) {
                // Verify the token is a registration token
                if (!jwtService.isRegistrationToken(request.getRegToken())) {
                        throw new RuntimeException("Invalid registration token");
                }

                String email = jwtService.extractUsername(request.getRegToken());

                if (userRepository.existsByEmail(email)) {
                        throw new RuntimeException("Email already exists");
                }

                // Generate random username
                String randomUsername = "user_" + java.util.UUID.randomUUID().toString().substring(0, 8);
                while (userRepository.existsByUsername(randomUsername)) {
                        randomUsername = "user_" + java.util.UUID.randomUUID().toString().substring(0, 8);
                }

                // Generate random password
                String randomPassword = java.util.UUID.randomUUID().toString();

                User user = User.builder()
                                .username(randomUsername)
                                .fullName(request.getFullName())
                                .email(email)
                                .password(passwordEncoder.encode(randomPassword))
                                .role(UserRole.user)
                                .globalRating(0)
                                .build();

                Profile profile = new Profile();
                profile.setUser(user);
                user.setProfile(profile);

                userRepository.save(user);

                String jwtToken = jwtService.generateToken(user);

                emailService.sendWelcomeEmail(user.getEmail(), user.getFullName());

                return AuthResponse.builder()
                                .token(jwtToken)
                                .id(user.getId())
                                .username(user.getUsername())
                                .fullName(user.getFullName())
                                .email(user.getEmail())
                                .role(user.getRole().name())
                                .avatarUrl(user.getProfile() != null ? user.getProfile().getAvatarUrl() : null)
                                .build();
        }

        public void forgotPassword(com.codegym.spring_boot.dto.auth.request.ForgotPasswordRequest request) {
                User user = userRepository.findByEmail(request.getEmail())
                                .orElseThrow(() -> new RuntimeException("Email không tồn tại trong hệ thống."));

                otpRepository.findTopByEmailAndUsedFalseOrderByExpiresAtDesc(request.getEmail())
                                .ifPresent(otp -> {
                                        otp.setUsed(true);
                                        otpRepository.save(otp);
                                });

                String otpCode = String.format("%06d", new java.util.Random().nextInt(999999));
                com.codegym.spring_boot.entity.Otp otp = com.codegym.spring_boot.entity.Otp.builder()
                                .email(request.getEmail())
                                .otpCode(otpCode)
                                .expiresAt(java.time.LocalDateTime.now().plusMinutes(10))
                                .used(false)
                                .build();
                otpRepository.save(otp);

                emailService.sendOtpEmail(user.getEmail(), user.getFullName(), otpCode);
        }

        public void verifyOtp(com.codegym.spring_boot.dto.auth.request.VerifyOtpRequest request) {
                com.codegym.spring_boot.entity.Otp otp = otpRepository
                                .findTopByEmailAndUsedFalseOrderByExpiresAtDesc(request.getEmail())
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy mã OTP cho email này."));

                if (otp.isExpired()) {
                        throw new RuntimeException("Mã OTP đã hết hạn.");
                }

                if (!otp.getOtpCode().equals(request.getOtp())) {
                        throw new RuntimeException("Mã OTP không hợp lệ.");
                }
        }

        @Transactional
        public void resetPassword(com.codegym.spring_boot.dto.auth.request.ResetPasswordRequest request) {
                com.codegym.spring_boot.entity.Otp otp = otpRepository
                                .findTopByEmailAndUsedFalseOrderByExpiresAtDesc(request.getEmail())
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy mã OTP hợp lệ."));

                if (otp.isExpired() || !otp.getOtpCode().equals(request.getOtp())) {
                        throw new RuntimeException("Mã OTP không hợp lệ hoặc đã hết hạn.");
                }

                User user = userRepository.findByEmail(request.getEmail())
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy user."));

                user.setPassword(passwordEncoder.encode(request.getNewPassword()));
                userRepository.save(user);

                otp.setUsed(true);
                otpRepository.save(otp);
        }
}
