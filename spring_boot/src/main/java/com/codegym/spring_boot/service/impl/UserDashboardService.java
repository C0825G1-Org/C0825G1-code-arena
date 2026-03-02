package com.codegym.spring_boot.service.impl;

import com.codegym.spring_boot.dto.dashboard.response.TopCoderResponse;
import com.codegym.spring_boot.dto.dashboard.response.UserStatsResponse;
import com.codegym.spring_boot.entity.User;
import com.codegym.spring_boot.entity.enums.UserRole;
import com.codegym.spring_boot.repository.SubmissionRepository;
import com.codegym.spring_boot.repository.UserRepository;
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

    @Override
    public UserStatsResponse getUserStats(User user) {
        Integer userId = user.getId();
        int globalRating = user.getGlobalRating() != null ? user.getGlobalRating() : 1500;

        // 1. Calculate Elo Ranking and Top %
        long rank = userRepository.countByGlobalRatingGreaterThan(globalRating) + 1;
        long totalUsers = userRepository.count();
        double topPercent = totalUsers > 0 ? ((double) rank / totalUsers) * 100 : 0.0;

        // 2. Count distinct solved problems
        long solvedCount = submissionRepository.countDistinctAcceptedProblemsByUserId(userId);

        // 3. Calculate AC Rate
        long totalSubmissions = submissionRepository.countTotalSubmissionsByUserId(userId);
        long acceptedSubmissions = submissionRepository.countAcceptedSubmissionsByUserId(userId);
        double acRate = totalSubmissions > 0 ? ((double) acceptedSubmissions / totalSubmissions) * 100 : 0.0;

        // 4. Calculate Streak
        List<Date> acDates = submissionRepository.findDistinctAcceptedDatesByUserIdDesc(userId);
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
        // Fetch top 3 users with role USER
        List<User> topUsers = userRepository.findTop3ByRoleOrderByGlobalRatingDesc(UserRole.user);
        
        return topUsers.stream().map(user -> TopCoderResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .globalRating(user.getGlobalRating() != null ? user.getGlobalRating() : 1500)
                .build()
        ).collect(Collectors.toList());
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
}
