package com.codegym.spring_boot.service.impl;

import com.codegym.spring_boot.dto.dashboard.response.TopCoderResponse;
import com.codegym.spring_boot.dto.dashboard.response.UserStatsResponse;
import com.codegym.spring_boot.entity.User;
import com.codegym.spring_boot.entity.enums.SubmissionStatus;
import com.codegym.spring_boot.entity.enums.UserRole;
import com.codegym.spring_boot.repository.SubmissionRepository;
import com.codegym.spring_boot.repository.UserRepository;
import com.codegym.spring_boot.repository.ContestParticipantRepository;
import com.codegym.spring_boot.service.IUserDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.sql.Date;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserDashboardService implements IUserDashboardService {

        private final UserRepository userRepository;
        private final SubmissionRepository submissionRepository;
        private final ContestParticipantRepository contestParticipantRepository;

        @Override
        public UserStatsResponse getUserStats(User user) {
                Integer userId = user.getId();
                int globalRating = user.getGlobalRating() != null ? user.getGlobalRating() : 0;

                // 1. Calculate Rank and Top % (smaller global_rating is better)
                long rank = userRepository.countGlobalRank(UserRole.user, globalRating, userId) + 1;
                long totalUsers = userRepository.count();
                double topPercent = totalUsers > 0 ? ((double) rank / totalUsers) * 100 : 0.0;

                // 2. Count distinct solved problems
                long solvedCount = submissionRepository.countDistinctAcceptedProblemsByUserId(userId,
                                SubmissionStatus.AC);

                // 3. Calculate AC Rate
                long totalSubmissions = submissionRepository.countTotalSubmissionsByUserId(userId);
                long acceptedSubmissions = submissionRepository.countAcceptedSubmissionsByUserId(userId,
                                SubmissionStatus.AC);
                double acRate = totalSubmissions > 0 ? ((double) acceptedSubmissions / totalSubmissions) * 100 : 0.0;

                // 4. Calculate Streak
                List<Date> acDates = submissionRepository.findDistinctAcceptedDatesByUserIdDesc(userId,
                                SubmissionStatus.AC);
                int streak = calculateStreak(acDates);

                return UserStatsResponse.builder()
                                .eloRanking(globalRating)
                                .topPercent(Math.round(topPercent * 100.0) / 100.0) // Round to 2 decimals
                                .solvedCount(solvedCount)
                                .acRate(Math.round(acRate * 100.0) / 100.0) // Round to 2 decimals
                                .streak(streak)
                                .build();
        }

        @Override
        public List<TopCoderResponse> getTopCoders() {
                // Fetch top 3 users with role USER in ascending order (smaller rating = higher
                // rank)
                List<User> topUsers = userRepository.findTop3ByRoleOrderByGlobalRatingDescIdAsc(UserRole.user);

                return topUsers.stream().map(user -> TopCoderResponse.builder()
                                .userId(user.getId())
                                .username(user.getUsername())
                                .fullName(user.getFullName())
                                .globalRating(user.getGlobalRating() != null ? user.getGlobalRating() : 0)
                                .avatarUrl(user.getProfile() != null ? user.getProfile().getAvatarUrl() : null)
                                .build()).collect(Collectors.toList());
        }

        private int calculateStreak(List<Date> acDatesDesc) {
                if (acDatesDesc == null || acDatesDesc.isEmpty()) {
                        return 0;
                }

                List<LocalDate> localDates = acDatesDesc.stream()
                                .map(Date::toLocalDate)
                                .collect(Collectors.toList());

                LocalDate today = LocalDate.now();
                LocalDate yesterday = today.minusDays(1);

                LocalDate latestAcDate = localDates.get(0);

                // If the latest AC is not today and not yesterday, the streak is broken (0)
                if (!latestAcDate.equals(today) && !latestAcDate.equals(yesterday)) {
                        return 0;
                }

                int streak = 1;
                LocalDate expectedNextDate = latestAcDate.minusDays(1);

                for (int i = 1; i < localDates.size(); i++) {
                        LocalDate currentDate = localDates.get(i);
                        if (currentDate.equals(expectedNextDate)) {
                                streak++;
                                expectedNextDate = expectedNextDate.minusDays(1);
                        } else {
                                break; // Gap found, streak ends
                        }
                }

                return streak;
        }

        @Override
        public List<com.codegym.spring_boot.dto.dashboard.response.RecentSubmissionResponse> getRecentSubmissions(
                        User user,
                        int limit) {
                org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0,
                                limit);
                return submissionRepository.findRecentSubmissionsByUserId(user.getId(), pageable).stream()
                                .map(sub -> com.codegym.spring_boot.dto.dashboard.response.RecentSubmissionResponse
                                                .builder()
                                                .id(sub.getId())
                                                .problemTitle(sub.getProblem().getTitle())
                                                .problemId(sub.getProblem().getId())
                                                .status(sub.getStatus().name())
                                                .language(sub.getLanguage().getName())
                                                .executionTime(sub.getExecutionTime() != null
                                                                ? sub.getExecutionTime().longValue()
                                                                : 0L)
                                                .memoryUsage(sub.getMemoryUsed() != null ? sub.getMemoryUsed() / 1024.0
                                                                : 0.0) // Convert KB to
                                                                       // MB
                                                .createdAt(sub.getCreatedAt())
                                                .build())
                                .collect(Collectors.toList());
        }

        @Override
        public List<com.codegym.spring_boot.dto.dashboard.response.SubmissionStatusStatResponse> getSubmissionStatusStats(
                        User user) {
                List<Object[]> rawStats = submissionRepository.countStatusStatByUserId(user.getId());
                return rawStats.stream()
                                .map(obj -> com.codegym.spring_boot.dto.dashboard.response.SubmissionStatusStatResponse
                                                .builder()
                                                .status(obj[0].toString())
                                                .count(((Number) obj[1]).longValue())
                                                .build())
                                .collect(Collectors.toList());
        }

        @Override
        public List<com.codegym.spring_boot.dto.dashboard.response.HeatmapResponse> getActivityHeatmap(User user,
                        int days) {
                LocalDate since = LocalDate.now().minusDays(days - 1); // e.g. 30 days including today
                List<Object[]> rawData = submissionRepository.countHeatmapByUserIdAndDateRange(user.getId(),
                                since.atStartOfDay());
                return rawData.stream()
                                .map(obj -> com.codegym.spring_boot.dto.dashboard.response.HeatmapResponse.builder()
                                                .date(((java.sql.Date) obj[0]).toLocalDate())
                                                .count(((Number) obj[1]).longValue())
                                                .build())
                                .collect(Collectors.toList());
        }

        @Override
        public List<com.codegym.spring_boot.dto.dashboard.response.RecentContestResponse> getRecentContests(User user,
                        int limit) {
                org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0,
                                limit);
                return contestParticipantRepository.findRecentContestsByUserId(user.getId(), pageable).stream()
                                .map(cp -> com.codegym.spring_boot.dto.dashboard.response.RecentContestResponse
                                                .builder()
                                                .contestId(cp.getContest() != null ? cp.getContest().getId() : null)
                                                .title(cp.getContest() != null ? cp.getContest().getTitle()
                                                                : "Unknown Contest")
                                                .totalScore(cp.getTotalScore() != null ? cp.getTotalScore() : 0)
                                                .totalPenalty(cp.getTotalPenalty() != null ? cp.getTotalPenalty() : 0)
                                                .status(cp.getStatus() != null ? cp.getStatus().name() : "JOINED")
                                                .startTime(cp.getContest() != null ? cp.getContest().getStartTime()
                                                                : null)
                                                .endTime(cp.getContest() != null ? cp.getContest().getEndTime() : null)
                                                .joinedAt(cp.getCreatedAt())
                                                .build())
                                .collect(Collectors.toList());
        }
}
