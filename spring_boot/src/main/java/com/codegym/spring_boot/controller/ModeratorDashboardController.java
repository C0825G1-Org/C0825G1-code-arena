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
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/moderator/dashboard")
@RequiredArgsConstructor
public class ModeratorDashboardController {

    private final IModeratorDashboardService moderatorDashboardService;

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    public ResponseEntity<ModeratorDashboardResponse> getDashboardStats(@AuthenticationPrincipal User currentUser) {
        ModeratorDashboardResponse stats = moderatorDashboardService.getDashboardStats(currentUser.getId());
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/contests/{contestId}/monitor")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    public ResponseEntity<com.codegym.spring_boot.dto.moderator.response.MonitorDashboardResponse> getMonitorStats(
            @org.springframework.web.bind.annotation.PathVariable Integer contestId,
            @AuthenticationPrincipal User currentUser) {
        com.codegym.spring_boot.dto.moderator.response.MonitorDashboardResponse stats = 
                moderatorDashboardService.getMonitorStats(contestId, currentUser.getId());
        return ResponseEntity.ok(stats);
    }
    @GetMapping("/contests/{contestId}/monitor/leaderboard")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    public ResponseEntity<Page<com.codegym.spring_boot.dto.moderator.response.MonitorDashboardResponse.MonitorLeaderboardEntry>> getMonitorLeaderboard(
            @org.springframework.web.bind.annotation.PathVariable Integer contestId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @AuthenticationPrincipal User currentUser) {
        
        // Ensure ownership before returning leaderboard
        moderatorDashboardService.validateContestOwnership(contestId, currentUser.getId());
        
        Page<com.codegym.spring_boot.dto.moderator.response.MonitorDashboardResponse.MonitorLeaderboardEntry> leaderboardPage = 
                moderatorDashboardService.getPaginatedMonitorLeaderboard(contestId, page, size);
        return ResponseEntity.ok(leaderboardPage);
    }
}
