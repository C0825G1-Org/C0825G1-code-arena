package com.codegym.spring_boot.controller;

import com.codegym.spring_boot.dto.user.request.ChangePasswordRequest;
import com.codegym.spring_boot.dto.user.request.UpdateProfileRequest;
import com.codegym.spring_boot.dto.user.response.UserProfileResponse;
import com.codegym.spring_boot.entity.User;
import com.codegym.spring_boot.service.IUserSettingsService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;

@RestController
@RequestMapping("/api/users/settings")
@RequiredArgsConstructor
@Slf4j
public class UserSettingsController {

    private final IUserSettingsService userSettingsService;

    @Operation(summary = "Get user profile", description = "Retrieves the current user's profile details.")
    @GetMapping("/profile")
    public ResponseEntity<UserProfileResponse> getSettingsProfile(@AuthenticationPrincipal User user) {
        if (user == null)
            return ResponseEntity.status(401).build();
        return ResponseEntity.ok(userSettingsService.getUserProfile(user));
    }

    @Operation(summary = "Update user profile", description = "Updates full name, bio, and github link.")
    @PutMapping("/profile")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody UpdateProfileRequest request) {
        if (user == null)
            return ResponseEntity.status(401).build();
        return ResponseEntity.ok(userSettingsService.updateProfile(user, request));
    }

    @Operation(summary = "Upload user avatar", description = "Uploads a new avatar file to Cloudinary and saves URL.")
    @PostMapping("/avatar")
    public ResponseEntity<Map<String, String>> uploadAvatar(
            @AuthenticationPrincipal User user,
            @RequestParam("file") MultipartFile file) {
        if (user == null)
            return ResponseEntity.status(401).build();
        try {
            String url = userSettingsService.uploadAvatar(user, file);
            return ResponseEntity.ok(Map.of("avatarUrl", url));
        } catch (Exception e) {
            log.error("Lỗi khi upload avatar", e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Lỗi khi tải ảnh lên server: " + e.getMessage()));
        }
    }

    @Operation(summary = "Change user password", description = "Changes the user password.")
    @PutMapping("/password")
    public ResponseEntity<Map<String, String>> changePassword(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ChangePasswordRequest request) {
        if (user == null)
            return ResponseEntity.status(401).build();
        try {
            userSettingsService.changePassword(user, request);
            return ResponseEntity.ok(Map.of("message", "Mật khẩu đã được cập nhật thành công"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @Operation(summary = "Equip avatar frame", description = "Equips a purchased avatar frame.")
    @PatchMapping("/equip-frame/{itemId}")
    public ResponseEntity<UserProfileResponse> equipFrame(
            @AuthenticationPrincipal User user,
            @PathVariable Integer itemId) {
        if (user == null)
            return ResponseEntity.status(401).build();
        return ResponseEntity.ok(userSettingsService.equipFrame(user, itemId));
    }

    @Operation(summary = "Unequip avatar frame", description = "Unequips the current avatar frame.")
    @DeleteMapping("/unequip-frame")
    public ResponseEntity<UserProfileResponse> unequipFrame(
            @AuthenticationPrincipal User user) {
        if (user == null)
            return ResponseEntity.status(401).build();
        return ResponseEntity.ok(userSettingsService.unequipFrame(user));
    }
}
