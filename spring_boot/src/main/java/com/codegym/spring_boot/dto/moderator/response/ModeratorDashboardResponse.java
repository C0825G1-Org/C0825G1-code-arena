package com.codegym.spring_boot.dto.moderator.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.codegym.spring_boot.dto.contest.response.ContestListResponse;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModeratorDashboardResponse {
    private long totalParticipants;
    private long totalContests;
    private long submissionsLast24h;
    private long pendingProblems;
    private List<ContestListResponse> activeContests;
    private List<com.codegym.spring_boot.dto.admin.HourlySubmissionDTO> submissionTrend;
    private List<com.codegym.spring_boot.dto.admin.VerdictStatsDTO> verdictStats;
}
