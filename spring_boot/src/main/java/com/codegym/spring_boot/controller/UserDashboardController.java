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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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

    @Operation(summary = "Get user statistics by ID", description = "Retrieves statistics for a specific user.")
    @GetMapping("/stats/{userId}")
    public ResponseEntity<UserStatsResponse> getUserStatsById(@PathVariable Integer userId) {
        UserStatsResponse stats = userDashboardService.getUserStats(userId);
        return ResponseEntity.ok(stats);
    }

    @Operation(summary = "Get top 3 coders", description = "Retrieves the top 3 users by global rating.")
    @GetMapping("/top-coders")
    public ResponseEntity<List<TopCoderResponse>> getTopCoders() {
        List<TopCoderResponse> topCoders = userDashboardService.getTopCoders();
        return ResponseEntity.ok(topCoders);
    }

    @Operation(summary = "Get recent submissions", description = "Retrieves the user's latest N submissions.")
    @GetMapping("/submissions/recent")
    public ResponseEntity<List<com.codegym.spring_boot.dto.dashboard.response.RecentSubmissionResponse>> getRecentSubmissions(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "10") int limit) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(userDashboardService.getRecentSubmissions(user, limit));
    }

    @Operation(summary = "Get recent submissions by user ID", description = "Retrieves the latest N submissions for a specific user.")
    @GetMapping("/submissions/recent/{userId}")
    public ResponseEntity<List<com.codegym.spring_boot.dto.dashboard.response.RecentSubmissionResponse>> getRecentSubmissionsById(
            @PathVariable Integer userId,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(userDashboardService.getRecentSubmissions(userId, limit));
    }

    @Operation(summary = "Get submission status stats", description = "Retrieves count of submissions by status for doughnut chart.")
    @GetMapping("/submissions/stats")
    public ResponseEntity<List<com.codegym.spring_boot.dto.dashboard.response.SubmissionStatusStatResponse>> getSubmissionStatusStats(
            @AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(userDashboardService.getSubmissionStatusStats(user));
    }

    @Operation(summary = "Get submission status stats by user ID", description = "Retrieves count of submissions by status for a specific user.")
    @GetMapping("/submissions/stats/{userId}")
    public ResponseEntity<List<com.codegym.spring_boot.dto.dashboard.response.SubmissionStatusStatResponse>> getSubmissionStatusStatsById(
            @PathVariable Integer userId) {
        return ResponseEntity.ok(userDashboardService.getSubmissionStatusStats(userId));
    }

    @Operation(summary = "Get activity heatmap", description = "Retrieves submission count per day for the last N days.")
    @GetMapping("/submissions/heatmap")
    public ResponseEntity<List<com.codegym.spring_boot.dto.dashboard.response.HeatmapResponse>> getActivityHeatmap(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "30") int days) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(userDashboardService.getActivityHeatmap(user, days));
    }

    @Operation(summary = "Get activity heatmap by user ID", description = "Retrieves submission count per day for a specific user.")
    @GetMapping("/submissions/heatmap/{userId}")
    public ResponseEntity<List<com.codegym.spring_boot.dto.dashboard.response.HeatmapResponse>> getActivityHeatmapById(
            @PathVariable Integer userId,
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(userDashboardService.getActivityHeatmap(userId, days));
    }

    @Operation(summary = "Get recent contests", description = "Retrieves the user's latest N participated contests.")
    @GetMapping("/contests/recent")
    public ResponseEntity<List<com.codegym.spring_boot.dto.dashboard.response.RecentContestResponse>> getRecentContests(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "10") int limit) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(userDashboardService.getRecentContests(user, limit));
    }

    @Operation(summary = "Get recent contests by user ID", description = "Retrieves the latest N participated contests for a specific user.")
    @GetMapping("/contests/recent/{userId}")
    public ResponseEntity<List<com.codegym.spring_boot.dto.dashboard.response.RecentContestResponse>> getRecentContestsById(
            @PathVariable Integer userId,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(userDashboardService.getRecentContests(userId, limit));
    }
}
