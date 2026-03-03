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
}
