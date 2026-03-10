package com.codegym.spring_boot.controller;

import com.codegym.spring_boot.dto.user.response.UserProfileResponse;
import com.codegym.spring_boot.service.IUserSettingsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Public User", description = "Endpoints for Public User Profile")
public class PublicUserController {

    private final IUserSettingsService userSettingsService;

    @Operation(summary = "Get public user profile", description = "Retrieves profile details for a specific user.")
    @GetMapping("/{userId}/profile")
    public ResponseEntity<UserProfileResponse> getUserProfile(@PathVariable Integer userId) {
        try {
            return ResponseEntity.ok(userSettingsService.getUserProfileById(userId));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
