package com.codegym.spring_boot.service;

import com.codegym.spring_boot.dto.dashboard.response.LeaderboardUserResponse;
import org.springframework.data.domain.Page;

public interface IGlobalLeaderboardService {
    Page<LeaderboardUserResponse> getGlobalLeaderboard(String search, String type, int page, int size);
}
