package com.codegym.spring_boot.dto.leaderboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardDTO {
    private Integer rank;
    private Integer userId;
    private String username;
    private String fullName;
    private Integer totalScore;    // Number of AC problems
    private Integer totalPenalty;  // Total time penalty
    private List<ProblemDetail> problemDetails;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProblemDetail {
        private Integer problemId;
        private Boolean isAccepted;
        private Integer failedAttempts;
        private Integer solvedTimeMinutes; // Time passed from contest start to AC in minutes
    }
}
