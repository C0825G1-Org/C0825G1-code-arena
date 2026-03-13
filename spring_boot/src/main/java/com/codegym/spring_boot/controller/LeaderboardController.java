package com.codegym.spring_boot.controller;

import com.codegym.spring_boot.dto.dashboard.response.LeaderboardUserResponse;
import com.codegym.spring_boot.service.IGlobalLeaderboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/leaderboard")
@RequiredArgsConstructor
public class LeaderboardController {

    private final IGlobalLeaderboardService globalLeaderboardService;

    @GetMapping
    public ResponseEntity<Page<LeaderboardUserResponse>> getLeaderboard(
            @RequestParam(required = false, defaultValue = "") String search,
            @RequestParam(defaultValue = "contest") String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Page<LeaderboardUserResponse> response = globalLeaderboardService.getGlobalLeaderboard(search, type, page, size);
        return ResponseEntity.ok(response);
    }
}
