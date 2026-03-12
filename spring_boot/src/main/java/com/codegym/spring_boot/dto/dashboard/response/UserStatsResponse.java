package com.codegym.spring_boot.dto.dashboard.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserStatsResponse {
    private int eloRanking;
    private int practiceRating;
    private double topPercent;
    private long solvedCount;
    private double acRate;
    private int streak;
}
