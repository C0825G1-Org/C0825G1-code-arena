package com.codegym.spring_boot.service.impl;

import com.codegym.spring_boot.dto.contest.response.ContestListResponse;
import com.codegym.spring_boot.dto.moderator.response.ModeratorDashboardResponse;
import com.codegym.spring_boot.entity.Contest;
import com.codegym.spring_boot.entity.enums.ContestStatus;
import com.codegym.spring_boot.repository.ContestParticipantRepository;
import com.codegym.spring_boot.repository.ContestProblemRepository;
import com.codegym.spring_boot.repository.ContestRepository;
import com.codegym.spring_boot.repository.IProblemRepository;
import com.codegym.spring_boot.repository.SubmissionRepository;
import com.codegym.spring_boot.service.IModeratorDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.codegym.spring_boot.dto.admin.HourlySubmissionDTO;
import com.codegym.spring_boot.dto.admin.VerdictStatsDTO;
import com.codegym.spring_boot.entity.enums.SubmissionStatus;

@Service
@RequiredArgsConstructor
public class ModeratorDashboardService implements IModeratorDashboardService {

    private final ContestRepository contestRepository;
    private final ContestParticipantRepository contestParticipantRepository;
    private final SubmissionRepository submissionRepository;
    private final IProblemRepository problemRepository;
    private final ContestProblemRepository contestProblemRepository;

    @Override
    public ModeratorDashboardResponse getDashboardStats(Integer moderatorId) {

        long totalParticipants = contestParticipantRepository.countTotalParticipantsByModId(moderatorId);
        long totalContests = contestRepository.countByCreatedById(moderatorId);

        LocalDateTime cutoff24h = LocalDateTime.now().minusDays(1);
        long submissionsLast24h = submissionRepository.countSubmissionsForModRecent(moderatorId, cutoff24h);

        long pendingProblems = problemRepository.countPendingProblemsByCreator(moderatorId);

        Pageable top5Active = PageRequest.of(0, 5, Sort.by("startTime").descending());
        Page<Contest> activeContestPage = contestRepository.findByCreatedByIdAndStatus(moderatorId,
                ContestStatus.active, top5Active);

        List<ContestListResponse> activeContests = activeContestPage.getContent().stream().map(c -> {
            Integer firstProblemId = null;
            var problems = contestProblemRepository.findByIdContestIdOrderByOrderIndexAsc(c.getId());
            if (problems != null && !problems.isEmpty()) {
                firstProblemId = problems.get(0).getProblem().getId();
            }

            return ContestListResponse.builder()
                    .id(c.getId())
                    .title(c.getTitle())
                    .status(c.getStatus().name())
                    .startTime(c.getStartTime())
                    .endTime(c.getEndTime())
                    .participantCount(contestParticipantRepository.countByContestIdAndHasJoinedActiveTrue(c.getId()))
                    .serverTime(LocalDateTime.now())
                    .isRegistered(false)
                    .firstProblemId(firstProblemId)
                    .build();
        }).collect(Collectors.toList());

        return ModeratorDashboardResponse.builder()
                .totalParticipants(totalParticipants)
                .totalContests(totalContests)
                .submissionsLast24h(submissionsLast24h)
                .pendingProblems(pendingProblems)
                .activeContests(activeContests)
                .submissionTrend(getTrend(moderatorId, "24h"))
                .verdictStats(buildVerdictStats(moderatorId))
                .build();
    }

    @Override
    public com.codegym.spring_boot.dto.moderator.response.MonitorDashboardResponse getMonitorStats(Integer contestId,
            Integer moderatorId) {
        // Validate ownership
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy cuộc thi ID: " + contestId));
        if (!contest.getCreatedBy().getId().equals(moderatorId)) {
            throw new SecurityException("Bạn không có quyền giám sát cuộc thi này.");
        }

        // 1. Lấy tổng số người tham gia (chỉ đếm người đã vào thi)
        int activeParticipantsCount = (int) contestParticipantRepository
                .countByContestIdAndHasJoinedActiveTrue(contestId);

        // 2. Lấy tổng số lượt nộp bài
        int totalSubmissionsCount = submissionRepository.countByContestId(contestId);

        // 3. Tính thời gian còn lại (seconds)
        long remainingTimeSeconds = 0L;
        if (contest.getEndTime() != null) {
            long diff = java.time.Duration.between(LocalDateTime.now(), contest.getEndTime()).getSeconds();
            remainingTimeSeconds = diff > 0 ? diff : 0;
        }

        // 4. Lấy Top 5 Bảng xếp hạng (Leaderboard ban đầu)
        List<com.codegym.spring_boot.entity.ContestParticipant> topParticipants = contestParticipantRepository
                .findByIdContestIdOrderByTotalScoreDescTotalPenaltyAsc(contestId)
                .stream().limit(5).collect(Collectors.toList());

        List<com.codegym.spring_boot.dto.moderator.response.MonitorDashboardResponse.MonitorLeaderboardEntry> leaderboard = new java.util.ArrayList<>();
        int rank = 1;
        for (var p : topParticipants) {
            String fullname = p.getUser().getFullName() != null ? p.getUser().getFullName() : p.getUser().getUsername();

            // Tính ACRate = Nộp trúng / Tổng Nộp (Cái này cần query thêm, tạm để 0.0 nếu
            // chưa có hàm đếm, hoăc fetch lượt nộp của user)
            // Tạm thời AC Rate = 0.0, sẽ bổ sung phương thức trong SubmissionRepository nếu
            // cần thiết.
            double acRate = 0.0;
            long totalUserSubs = submissionRepository.countByUserIdAndContestId(p.getUser().getId(), contestId);
            if (totalUserSubs > 0) {
                long acUserSubs = submissionRepository.countByUserIdAndContestIdAndStatus(p.getUser().getId(),
                        contestId, com.codegym.spring_boot.entity.enums.SubmissionStatus.AC);
                acRate = (double) acUserSubs / totalUserSubs * 100.0;
            }

            leaderboard
                    .add(com.codegym.spring_boot.dto.moderator.response.MonitorDashboardResponse.MonitorLeaderboardEntry
                            .builder()
                            .rank(rank++)
                            .userId(p.getUser().getId().longValue())
                            .username(p.getUser().getUsername())
                            .fullname(fullname)
                            .totalScore(p.getTotalScore())
                            .totalPenalty(p.getTotalPenalty())
                            .acRate(Math.round(acRate * 100.0) / 100.0)
                            .build());
        }

        // 5. Lấy 50 lượt nộp bài gần nhất để làm Feed (Live Log)
        Pageable top50 = PageRequest.of(0, 50, Sort.by("createdAt").descending());
        List<com.codegym.spring_boot.entity.Submission> recentSubs = submissionRepository
                .findByContestIdOrderByCreatedAtDesc(contestId, top50).getContent();

        List<com.codegym.spring_boot.dto.moderator.response.MonitorDashboardResponse.MonitorSubmissionLog> recentSubmissions = recentSubs
                .stream()
                .map(sub -> com.codegym.spring_boot.dto.moderator.response.MonitorDashboardResponse.MonitorSubmissionLog
                        .builder()
                        .submissionId(sub.getId())
                        .username(sub.getUser().getUsername())
                        .problemId(sub.getProblem().getId())
                        .problemTitle(sub.getProblem().getTitle())
                        .status(sub.getStatus().name())
                        .score(sub.getScore())
                        .submittedAt(sub.getCreatedAt().toString())
                        .build())
                .collect(Collectors.toList());

        return com.codegym.spring_boot.dto.moderator.response.MonitorDashboardResponse.builder()
                .activeParticipantsCount(activeParticipantsCount)
                .totalSubmissionsCount(totalSubmissionsCount)
                .remainingTimeSeconds(remainingTimeSeconds)
                .status(contest.getStatus().name())
                .startTime(contest.getStartTime() != null ? contest.getStartTime().toString() : null)
                .leaderboard(leaderboard)
                .recentSubmissions(recentSubmissions)
                .build();
    }

    @Override
    public void validateContestOwnership(Integer contestId, Integer moderatorId) {
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy cuộc thi ID: " + contestId));
        if (!contest.getCreatedBy().getId().equals(moderatorId)) {
            throw new SecurityException("Bạn không có quyền giám sát cuộc thi này.");
        }
    }

    @Override
    public Page<com.codegym.spring_boot.dto.moderator.response.MonitorDashboardResponse.MonitorLeaderboardEntry> getPaginatedMonitorLeaderboard(
            Integer contestId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<com.codegym.spring_boot.entity.ContestParticipant> participantPage = contestParticipantRepository
                .findByIdContestIdOrderByTotalScoreDescTotalPenaltyAsc(contestId, pageable);

        List<com.codegym.spring_boot.dto.moderator.response.MonitorDashboardResponse.MonitorLeaderboardEntry> leaderboard = new java.util.ArrayList<>();

        // Calculate rank offset correctly
        int rank = page * size + 1;

        for (var p : participantPage.getContent()) {
            String fullname = p.getUser().getFullName() != null ? p.getUser().getFullName() : p.getUser().getUsername();

            double acRate = 0.0;
            long totalUserSubs = submissionRepository.countByUserIdAndContestId(p.getUser().getId(), contestId);
            if (totalUserSubs > 0) {
                long acUserSubs = submissionRepository.countByUserIdAndContestIdAndStatus(p.getUser().getId(),
                        contestId, com.codegym.spring_boot.entity.enums.SubmissionStatus.AC);
                acRate = (double) acUserSubs / totalUserSubs * 100.0;
            }

            leaderboard
                    .add(com.codegym.spring_boot.dto.moderator.response.MonitorDashboardResponse.MonitorLeaderboardEntry
                            .builder()
                            .rank(rank++)
                            .userId(p.getUser().getId().longValue())
                            .username(p.getUser().getUsername())
                            .fullname(fullname)
                            .totalScore(p.getTotalScore())
                            .totalPenalty(p.getTotalPenalty())
                            .acRate(Math.round(acRate * 100.0) / 100.0)
                            .build());
        }

        return new PageImpl<>(leaderboard, pageable, participantPage.getTotalElements());
    }

    // ── Trend & Verdict Implementation ───────────────────────────────────────────

    @Override
    public List<HourlySubmissionDTO> getTrend(Integer modId, String range) {
        if ("7d".equals(range)) {
            return buildDailyTrend(modId);
        }
        int hours = switch (range) {
            case "6h" -> 6;
            case "12h" -> 12;
            default -> 24;
        };
        return buildHourlyTrend(modId, hours);
    }

    private List<HourlySubmissionDTO> buildHourlyTrend(Integer modId, int hours) {
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        List<Object[]> rows = submissionRepository.countByHour24hForMod(startOfToday, modId);

        Map<Integer, Long> hourMap = new HashMap<>();
        for (Object[] row : rows) {
            hourMap.put(((Number) row[0]).intValue(), ((Number) row[1]).longValue());
        }

        List<HourlySubmissionDTO> result = new ArrayList<>();
        for (int h = 0; h <= 23; h++) {
            result.add(new HourlySubmissionDTO(String.format("%02dh", h), hourMap.getOrDefault(h, 0L)));
        }
        return result;
    }

    private List<HourlySubmissionDTO> buildDailyTrend(Integer modId) {
        LocalDateTime since = LocalDateTime.now().minusDays(7);
        List<Object[]> rows = submissionRepository.countByDayForMod(since, modId);

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

    @Override
    public List<HourlySubmissionDTO> getTrendByRange(Integer modId, LocalDate from, LocalDate to) {
        LocalDateTime fromDT = from.atStartOfDay();
        LocalDateTime toDT = to.plusDays(1).atStartOfDay(); // inclusive to

        List<Object[]> rows = submissionRepository.countByDateRangeForMod(fromDT, toDT, modId);

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

    private static final Map<SubmissionStatus, String[]> VERDICT_META = Map.of(
            SubmissionStatus.AC, new String[] { "Accepted", "#22c55e" },
            SubmissionStatus.WA, new String[] { "Wrong Answer", "#ef4444" },
            SubmissionStatus.TLE, new String[] { "Time Limit", "#f59e0b" },
            SubmissionStatus.MLE, new String[] { "Memory Limit", "#8b5cf6" },
            SubmissionStatus.RE, new String[] { "Runtime Error", "#a855f7" },
            SubmissionStatus.CE, new String[] { "Compile Error", "#64748b" });

    private List<VerdictStatsDTO> buildVerdictStats(Integer modId) {
        List<Object[]> rows = submissionRepository.countByStatusForMod(modId);
        List<VerdictStatsDTO> result = new ArrayList<>();
        for (Object[] row : rows) {
            SubmissionStatus status = (SubmissionStatus) row[0];
            long count = ((Number) row[1]).longValue();
            if (count == 0)
                continue;
            String[] meta = VERDICT_META.get(status);
            if (meta == null)
                continue;
            result.add(new VerdictStatsDTO(meta[0], count, meta[1]));
        }
        return result;
    }
}
