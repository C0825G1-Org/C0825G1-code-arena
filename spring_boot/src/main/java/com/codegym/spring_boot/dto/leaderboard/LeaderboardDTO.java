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
    private String avatarUrl;
    private String avatarFrame;
    private Integer totalScore; // Number of AC problems
    private Integer totalPenalty; // Total time penalty
    private Integer totalSolved; // Added
    private Boolean hasScorePenalty; // Added
    private String status; // Added
    private Integer globalRating; // Added for User Rank Display
    private List<ProblemDetail> problemDetails;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProblemDetail {
        private Integer problemId;
        private Boolean isAccepted;
        private Integer failedAttempts;
        private Integer solvedTimeMinutes; // Thời gian từ lúc bắt đầu thi đến khi AC (phút)
        private Integer score; // Điểm thực tế (tổng scoreWeight các test pass)
        private Integer maxScore; // Tổng scoreWeight tối đa của bài (điểm đầy đủ)
        private Integer penaltyMinutes; // Penalty ICPC = solvedTimeMinutes + failedAttempts * 20
    }
}
