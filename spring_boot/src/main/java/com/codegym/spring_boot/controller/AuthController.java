package com.codegym.spring_boot.controller;

import com.codegym.spring_boot.dto.auth.request.LoginRequest;
import com.codegym.spring_boot.dto.auth.request.RegisterRequest;
import com.codegym.spring_boot.dto.auth.response.AuthResponse;
import com.codegym.spring_boot.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/oauth2/complete-profile")
    public ResponseEntity<AuthResponse> completeProfile(
            @Valid @RequestBody com.codegym.spring_boot.dto.auth.request.CompleteProfileRequest request) {
        return ResponseEntity.ok(authService.completeOauth2Profile(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> authenticate(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.authenticate(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<com.codegym.spring_boot.dto.auth.response.MessageResponse> forgotPassword(
            @Valid @RequestBody com.codegym.spring_boot.dto.auth.request.ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(
                new com.codegym.spring_boot.dto.auth.response.MessageResponse("Mã OTP đã được gửi đến email của bạn."));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<com.codegym.spring_boot.dto.auth.response.MessageResponse> verifyOtp(
            @Valid @RequestBody com.codegym.spring_boot.dto.auth.request.VerifyOtpRequest request) {
        authService.verifyOtp(request);
        return ResponseEntity.ok(new com.codegym.spring_boot.dto.auth.response.MessageResponse("Mã OTP hợp lệ."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<com.codegym.spring_boot.dto.auth.response.MessageResponse> resetPassword(
            @Valid @RequestBody com.codegym.spring_boot.dto.auth.request.ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(
                new com.codegym.spring_boot.dto.auth.response.MessageResponse("Mật khẩu đã được thay đổi thành công."));
    }
}
