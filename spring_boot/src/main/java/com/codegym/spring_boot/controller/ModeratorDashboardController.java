package com.codegym.spring_boot.controller;

import com.codegym.spring_boot.dto.moderator.response.ModeratorDashboardResponse;
import com.codegym.spring_boot.entity.User;
import com.codegym.spring_boot.service.IModeratorDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/moderator/dashboard")
@RequiredArgsConstructor
public class ModeratorDashboardController {

    private final IModeratorDashboardService moderatorDashboardService;
    private final com.codegym.spring_boot.service.ProblemDiscussionService discussionService;

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    public ResponseEntity<ModeratorDashboardResponse> getDashboardStats(@AuthenticationPrincipal User currentUser) {
        ModeratorDashboardResponse stats = moderatorDashboardService.getDashboardStats(currentUser.getId());
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/trend")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    public ResponseEntity<java.util.List<com.codegym.spring_boot.dto.admin.HourlySubmissionDTO>> getTrend(
            @RequestParam(defaultValue = "24h") String range,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(moderatorDashboardService.getTrend(currentUser.getId(), range));
    }

    @GetMapping("/trend/custom")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    public ResponseEntity<java.util.List<com.codegym.spring_boot.dto.admin.HourlySubmissionDTO>> getTrendByRange(
            @RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate from,
            @RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate to,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(moderatorDashboardService.getTrendByRange(currentUser.getId(), from, to));
    }

    @GetMapping("/contests/{contestId}/monitor")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    public ResponseEntity<com.codegym.spring_boot.dto.moderator.response.MonitorDashboardResponse> getMonitorStats(
            @org.springframework.web.bind.annotation.PathVariable Integer contestId,
            @AuthenticationPrincipal User currentUser) {
        boolean isAdmin = currentUser.getRole().name().equalsIgnoreCase("admin");
        com.codegym.spring_boot.dto.moderator.response.MonitorDashboardResponse stats = 
                moderatorDashboardService.getMonitorStats(contestId, currentUser.getId(), isAdmin);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/contests/{contestId}/monitor/leaderboard")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    public ResponseEntity<Page<com.codegym.spring_boot.dto.moderator.response.MonitorDashboardResponse.MonitorLeaderboardEntry>> getMonitorLeaderboard(
            @org.springframework.web.bind.annotation.PathVariable Integer contestId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @AuthenticationPrincipal User currentUser) {
        boolean isAdmin = currentUser.getRole().name().equalsIgnoreCase("admin");
        // Ensure ownership before returning leaderboard
        moderatorDashboardService.validateContestOwnership(contestId, currentUser.getId(), isAdmin);
        
        Page<com.codegym.spring_boot.dto.moderator.response.MonitorDashboardResponse.MonitorLeaderboardEntry> leaderboardPage = 
                moderatorDashboardService.getPaginatedMonitorLeaderboard(contestId, page, size);
        return ResponseEntity.ok(leaderboardPage);
    }

    @PutMapping("/users/{userId}/lock")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    public ResponseEntity<Void> toggleUserLock(
            @PathVariable Integer userId,
            @RequestParam String type,
            @RequestParam boolean locked) {
        moderatorDashboardService.toggleUserLock(userId, type, locked);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/discussions")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    public ResponseEntity<Page<com.codegym.spring_boot.dto.discussion.response.ProblemDiscussionResponse>> getAllDiscussions(
            @RequestParam(required = false) Integer problemId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<com.codegym.spring_boot.dto.discussion.response.ProblemDiscussionResponse> discussions = discussionService
                .getAllDiscussions(problemId, page, size);
        return ResponseEntity.ok(discussions);
    }
}
