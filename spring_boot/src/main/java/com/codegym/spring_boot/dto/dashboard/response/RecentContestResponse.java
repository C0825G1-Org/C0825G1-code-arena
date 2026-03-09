package com.codegym.spring_boot.dto.dashboard.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RecentContestResponse {
    private Integer contestId;
    private String title;
    private Integer totalScore;
    private Integer totalPenalty;
    private String status;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime joinedAt;
}
