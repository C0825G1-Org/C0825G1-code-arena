package com.codegym.spring_boot.service;

import com.codegym.spring_boot.dto.admin.AdminDashboardStatsDTO;
import com.codegym.spring_boot.dto.admin.HourlySubmissionDTO;

import java.time.LocalDate;
import java.util.List;

public interface IAdminDashboardService {
    AdminDashboardStatsDTO getStats();
    List<HourlySubmissionDTO> getTrend(String range);
    List<HourlySubmissionDTO> getTrendByRange(LocalDate from, LocalDate to);
}
