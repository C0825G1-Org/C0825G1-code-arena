package com.codegym.spring_boot.dto.contest.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContestDetailResponse {
    private Integer id;
    private String title;
    private String description;
    private String status;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private boolean isRegistered;
    private LocalDateTime serverTime;
    private String createdBy;
    private long participantCount;
    private List<ContestProblemResponse> problems; // null nếu chưa được phép xem
    private List<RankingEntry> ranking; // chỉ khi FINISHED

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ContestProblemResponse {
        private Integer id;
        private Integer orderIndex;
        private String title;
        private String difficulty;
        private boolean isFrozen;
        private String frozenReason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RankingEntry {
        private Integer rank;
        private String username;
        private Integer totalScore;
        private Integer totalPenalty;
    }
}
