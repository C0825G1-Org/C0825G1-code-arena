package com.codegym.spring_boot.service;

import com.codegym.spring_boot.dto.dashboard.response.TopCoderResponse;
import com.codegym.spring_boot.dto.dashboard.response.UserStatsResponse;
import com.codegym.spring_boot.entity.User;

import java.util.List;

public interface IUserDashboardService {
    UserStatsResponse getUserStats(User user);
    List<TopCoderResponse> getTopCoders();
}
