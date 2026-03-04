package com.codegym.spring_boot.service;

import com.codegym.spring_boot.dto.moderator.response.ModeratorDashboardResponse;
import org.springframework.data.domain.Page;

public interface IModeratorDashboardService {
    ModeratorDashboardResponse getDashboardStats(Integer moderatorId);
    
    com.codegym.spring_boot.dto.moderator.response.MonitorDashboardResponse getMonitorStats(Integer contestId, Integer moderatorId);

    void validateContestOwnership(Integer contestId, Integer moderatorId);

    Page<com.codegym.spring_boot.dto.moderator.response.MonitorDashboardResponse.MonitorLeaderboardEntry> getPaginatedMonitorLeaderboard(Integer contestId, int page, int size);
}
