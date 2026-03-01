package com.codegym.spring_boot.controller;

import com.codegym.spring_boot.dto.leaderboard.LeaderboardDTO;
import com.codegym.spring_boot.service.ILeaderboardService;
import com.codegym.spring_boot.service.IRatingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/contests")
@RequiredArgsConstructor
@Tag(name = "Leaderboard", description = "Endpoints for Contest Leaderboards and Rating Systems")
public class LeaderboardController {

    private final ILeaderboardService leaderboardService;
    private final IRatingService ratingService;

    @Operation(summary = "Get contest leaderboard", description = "Retrieves the real-time leaderboard for a specific contest, sorted by ICPC rules (score desc, penalty asc).")
    @GetMapping("/{id}/leaderboard")
    public ResponseEntity<List<LeaderboardDTO>> getContestLeaderboard(@PathVariable("id") Integer contestId) {
        List<LeaderboardDTO> leaderboard = leaderboardService.getLeaderboard(contestId);
        return ResponseEntity.ok(leaderboard);
    }

    @Operation(summary = "Calculate and apply rating changes", description = "Calculates the Elo rating changes for all participants after a contest ends and updates their global rating. Admin or Moderator only.")
    @PostMapping("/{id}/rating/calculate")
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<Map<String, String>> calculateContestRating(@PathVariable("id") Integer contestId) {
        ratingService.calculateAndApplyRatingChanges(contestId);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Rating changes calculated and applied successfully.");
        return ResponseEntity.ok(response);
    }
}
