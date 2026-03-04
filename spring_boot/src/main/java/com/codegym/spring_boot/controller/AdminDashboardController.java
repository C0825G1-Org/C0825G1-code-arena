package com.codegym.spring_boot.controller;

import com.codegym.spring_boot.dto.admin.AdminDashboardStatsDTO;
import com.codegym.spring_boot.dto.admin.HourlySubmissionDTO;
import com.codegym.spring_boot.service.IAdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final IAdminDashboardService adminDashboardService;

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminDashboardStatsDTO> getStats() {
        return ResponseEntity.ok(adminDashboardService.getStats());
    }

    @GetMapping("/submission-trend")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<HourlySubmissionDTO>> getSubmissionTrend(
            @RequestParam(defaultValue = "24h") String range) {
        return ResponseEntity.ok(adminDashboardService.getTrend(range));
    }

    @GetMapping("/submission-trend/range")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<HourlySubmissionDTO>> getSubmissionTrendByRange(
            @RequestParam String from,
            @RequestParam String to) {
        return ResponseEntity.ok(
                adminDashboardService.getTrendByRange(
                        LocalDate.parse(from),
                        LocalDate.parse(to)));
    }
}
