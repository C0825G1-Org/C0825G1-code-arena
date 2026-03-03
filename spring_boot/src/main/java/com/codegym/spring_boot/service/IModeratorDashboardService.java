package com.codegym.spring_boot.service;

import com.codegym.spring_boot.dto.moderator.response.ModeratorDashboardResponse;

public interface IModeratorDashboardService {
    ModeratorDashboardResponse getDashboardStats(Integer moderatorId);
}
