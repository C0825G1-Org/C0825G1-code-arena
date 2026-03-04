package com.codegym.spring_boot.controller;

import com.codegym.spring_boot.dto.dashboard.response.TopCoderResponse;
import com.codegym.spring_boot.dto.dashboard.response.UserStatsResponse;
import com.codegym.spring_boot.entity.User;

import com.codegym.spring_boot.service.IUserDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/user-dashboard")
@RequiredArgsConstructor
@Tag(name = "User Dashboard", description = "Endpoints for User Home Page Statistics")
public class UserDashboardController {

    private final IUserDashboardService userDashboardService;

    @Operation(summary = "Get current user statistics", description = "Retrieves Elo ranking, top percentage, solved count, AC rate, and hacking streak.")
    @GetMapping("/stats")
    public ResponseEntity<UserStatsResponse> getUserStats(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        UserStatsResponse stats = userDashboardService.getUserStats(user);
        return ResponseEntity.ok(stats);
    }

    @Operation(summary = "Get top 3 coders", description = "Retrieves the top 3 users by global rating.")
    @GetMapping("/top-coders")
    public ResponseEntity<List<TopCoderResponse>> getTopCoders() {
        List<TopCoderResponse> topCoders = userDashboardService.getTopCoders();
        return ResponseEntity.ok(topCoders);
    }
}
