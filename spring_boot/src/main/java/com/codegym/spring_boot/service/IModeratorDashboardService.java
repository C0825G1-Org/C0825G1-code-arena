package com.codegym.spring_boot.service;

import com.codegym.spring_boot.dto.moderator.response.ModeratorDashboardResponse;
import org.springframework.data.domain.Page;

public interface IModeratorDashboardService {
    ModeratorDashboardResponse getDashboardStats(Integer moderatorId);
    com.codegym.spring_boot.dto.moderator.response.MonitorDashboardResponse getMonitorStats(Integer contestId, Integer moderatorId, boolean isAdmin);

    void validateContestOwnership(Integer contestId, Integer moderatorId, boolean isAdmin);

    Page<com.codegym.spring_boot.dto.moderator.response.MonitorDashboardResponse.MonitorLeaderboardEntry> getPaginatedMonitorLeaderboard(
            Integer contestId, int page, int size);

    java.util.List<com.codegym.spring_boot.dto.admin.HourlySubmissionDTO> getTrend(Integer modId, String range);

    java.util.List<com.codegym.spring_boot.dto.admin.HourlySubmissionDTO> getTrendByRange(Integer modId,
            java.time.LocalDate from, java.time.LocalDate to);

    void toggleUserLock(Integer userId, String type, boolean locked);
}
