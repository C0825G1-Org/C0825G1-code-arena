package com.codegym.spring_boot.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardStatsDTO {
    private long totalUsers;
    private long totalProblems;
    private long totalSubmissions;
    private long activeLanguages;
    private long totalLanguages;
    private List<HourlySubmissionDTO> submissionTrend;
    private List<VerdictStatsDTO> verdictStats;
    private List<ActiveContestDTO> activeContests;
}
