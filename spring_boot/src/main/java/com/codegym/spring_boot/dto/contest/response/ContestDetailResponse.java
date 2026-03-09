package com.codegym.spring_boot.dto.contest.response;

import com.codegym.spring_boot.entity.enums.ParticipantStatus;
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
    @com.fasterxml.jackson.annotation.JsonProperty("isRegistered")
    private boolean isRegistered;
    private LocalDateTime serverTime;
    private String createdBy;
    private long participantCount;
    @Builder.Default
    private final int maxParticipants = 10;
    private ParticipantStatus participantStatus; // Trạng thái của user hiện tại
    private Integer violationCount;
    private Boolean hasScorePenalty;
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
        @com.fasterxml.jackson.annotation.JsonProperty("isFrozen")
        private boolean isFrozen;
        private String frozenReason;
        // Trạng thái nộp bài của user hiện tại cho bài này
        private Integer submitCount; // Số lần đã nộp bài thật (0–50)
        @com.fasterxml.jackson.annotation.JsonProperty("isAC")
        private Boolean isAC; // Đã AC (100đ) bài này hay chưa
        private Integer maxScore; // Tổng điểm tối đa của bài (theo testcase weights)
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
