package com.codegym.spring_boot.service.impl;

import com.codegym.spring_boot.dto.admin.ActiveContestDTO;
import com.codegym.spring_boot.dto.admin.AdminDashboardStatsDTO;
import com.codegym.spring_boot.dto.admin.HourlySubmissionDTO;
import com.codegym.spring_boot.dto.admin.VerdictStatsDTO;
import com.codegym.spring_boot.entity.enums.SubmissionStatus;
import com.codegym.spring_boot.repository.ContestParticipantRepository;
import com.codegym.spring_boot.repository.ContestProblemRepository;
import com.codegym.spring_boot.repository.ContestRepository;
import com.codegym.spring_boot.repository.IProblemRepository;
import com.codegym.spring_boot.repository.LanguageRepository;
import com.codegym.spring_boot.repository.SubmissionRepository;
import com.codegym.spring_boot.repository.UserRepository;
import com.codegym.spring_boot.service.IAdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminDashboardService implements IAdminDashboardService {

    private final UserRepository userRepository;
    private final SubmissionRepository submissionRepository;
    private final LanguageRepository languageRepository;
    private final IProblemRepository problemRepository;
    private final ContestRepository contestRepository;
    private final ContestParticipantRepository participantRepository;
    private final ContestProblemRepository contestProblemRepository;

    @Override
    public AdminDashboardStatsDTO getStats() {
        return AdminDashboardStatsDTO.builder()
                .totalUsers(userRepository.count())
                .totalProblems(problemRepository.countByIsDeletedFalse())
                .totalSubmissions(submissionRepository.countAllRealSubmissions())
                .activeLanguages(languageRepository.countByIsActiveTrue())
                .totalLanguages(languageRepository.count())
                .submissionTrend(getTrend("24h"))
                .verdictStats(buildVerdictStats())
                .activeContests(buildActiveContests())
                .build();
    }

    /**
     * range = "6h" | "12h" | "24h" → nhóm theo giờ, fill đủ N điểm
     * range = "7d"                  → nhóm theo ngày, fill đủ 7 ngày
     */
    @Override
    public List<HourlySubmissionDTO> getTrend(String range) {
        if ("7d".equals(range)) {
            return buildDailyTrend();
        }
        int hours = switch (range) {
            case "6h"  -> 6;
            case "12h" -> 12;
            default    -> 24;
        };
        return buildHourlyTrend(hours);
    }

    // ── Hourly trend ──────────────────────────────────────────────────────────

    private List<HourlySubmissionDTO> buildHourlyTrend(int hours) {
        // Always query from start of today
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        List<Object[]> rows = submissionRepository.countByHour24h(startOfToday);

        Map<Integer, Long> hourMap = new HashMap<>();
        for (Object[] row : rows) {
            hourMap.put(((Number) row[0]).intValue(), ((Number) row[1]).longValue());
        }

        // Always render full 24 hours (00h–23h); future hours show 0
        List<HourlySubmissionDTO> result = new ArrayList<>();
        for (int h = 0; h <= 23; h++) {
            result.add(new HourlySubmissionDTO(String.format("%02dh", h), hourMap.getOrDefault(h, 0L)));
        }
        return result;
    }

    // ── Daily trend ───────────────────────────────────────────────────────────

    private List<HourlySubmissionDTO> buildDailyTrend() {
        LocalDateTime since = LocalDateTime.now().minusDays(7);
        List<Object[]> rows = submissionRepository.countByDay(since);

        Map<String, Long> dayMap = new HashMap<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM");
        for (Object[] row : rows) {
            String day = ((java.sql.Date) row[0]).toLocalDate().format(fmt);
            dayMap.put(day, ((Number) row[1]).longValue());
        }

        List<HourlySubmissionDTO> result = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            String label = LocalDate.now().minusDays(i).format(fmt);
            result.add(new HourlySubmissionDTO(label, dayMap.getOrDefault(label, 0L)));
        }
        return result;
    }

    // ── Date-range trend ──────────────────────────────────────────────────────

    @Override
    public List<HourlySubmissionDTO> getTrendByRange(LocalDate from, LocalDate to) {
        LocalDateTime fromDT = from.atStartOfDay();
        LocalDateTime toDT   = to.plusDays(1).atStartOfDay(); // inclusive to

        List<Object[]> rows = submissionRepository.countByDateRange(fromDT, toDT);

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM");
        Map<String, Long> dayMap = new HashMap<>();
        for (Object[] row : rows) {
            String day = ((java.sql.Date) row[0]).toLocalDate().format(fmt);
            dayMap.put(day, ((Number) row[1]).longValue());
        }

        List<HourlySubmissionDTO> result = new ArrayList<>();
        LocalDate cur = from;
        while (!cur.isAfter(to)) {
            String label = cur.format(fmt);
            result.add(new HourlySubmissionDTO(label, dayMap.getOrDefault(label, 0L)));
            cur = cur.plusDays(1);
        }
        return result;
    }

    // ── Verdict distribution ──────────────────────────────────────────────────

    private static final Map<SubmissionStatus, String[]> VERDICT_META = Map.of(
        SubmissionStatus.AC,      new String[]{"Accepted",       "#22c55e"},
        SubmissionStatus.WA,      new String[]{"Wrong Answer",   "#ef4444"},
        SubmissionStatus.TLE,     new String[]{"Time Limit",     "#f59e0b"},
        SubmissionStatus.MLE,     new String[]{"Memory Limit",   "#8b5cf6"},
        SubmissionStatus.RE,      new String[]{"Runtime Error",  "#a855f7"},
        SubmissionStatus.CE,      new String[]{"Compile Error",  "#64748b"}
    );

    private List<VerdictStatsDTO> buildVerdictStats() {
        List<Object[]> rows = submissionRepository.countByStatus();
        List<VerdictStatsDTO> result = new ArrayList<>();
        for (Object[] row : rows) {
            SubmissionStatus status = (SubmissionStatus) row[0];
            long count = ((Number) row[1]).longValue();
            if (count == 0) continue;
            String[] meta = VERDICT_META.get(status);
            if (meta == null) continue;
            result.add(new VerdictStatsDTO(meta[0], count, meta[1]));
        }
        return result;
    }

    // ── Active & upcoming contests ─────────────────────────────────────────────

    private List<ActiveContestDTO> buildActiveContests() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay   = startOfDay.plusDays(1);

        return contestRepository
            .findActiveAndUpcomingToday(startOfDay, endOfDay)
            .stream()
            .map(c -> new ActiveContestDTO(
                c.getId(),
                c.getTitle(),
                (c.getStatus() != null ? c.getStatus().name() : com.codegym.spring_boot.entity.enums.ContestStatus.upcoming.name()),
                c.getStartTime(),
                c.getEndTime(),
                participantRepository.countByIdContestId(c.getId()),
                contestProblemRepository.countByIdContestId(c.getId())
            ))
            .collect(Collectors.toList());
    }
}
