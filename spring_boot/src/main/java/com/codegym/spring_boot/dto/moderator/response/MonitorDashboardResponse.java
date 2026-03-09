package com.codegym.spring_boot.dto.moderator.response;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class MonitorDashboardResponse {
    private Integer activeParticipantsCount;
    private Integer totalSubmissionsCount;
    private Long remainingTimeSeconds;
    private String status;
    private String startTime;
    private String endTime;

    // Paginated Leaderboard (Top 5 for initial page)
    private List<MonitorLeaderboardEntry> leaderboard;

    // Latest 50 submissions feed
    private List<MonitorSubmissionLog> recentSubmissions;

    @Data
    @Builder
    public static class MonitorLeaderboardEntry {
        private Integer rank;
        private Long userId;
        private String username;
        private String fullname;
        private Integer totalScore;
        private Integer totalPenalty;
        private Double acRate;
        private String status;
        private Boolean isCameraViolating;
    }

    @Data
    @Builder
    public static class MonitorSubmissionLog {
        private Integer submissionId;
        private String fullname;
        private Integer problemId;
        private String problemTitle;
        private String status;
        private Integer score;
        private String submittedAt;
    }
}
