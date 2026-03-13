package com.codegym.spring_boot.service.impl;

import com.codegym.spring_boot.dto.dashboard.response.LeaderboardUserResponse;
import com.codegym.spring_boot.entity.User;
import com.codegym.spring_boot.entity.enums.SubmissionStatus;
import com.codegym.spring_boot.entity.enums.UserRole;
import com.codegym.spring_boot.repository.SubmissionRepository;
import com.codegym.spring_boot.repository.UserRepository;
import com.codegym.spring_boot.service.IGlobalLeaderboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GlobalLeaderboardService implements IGlobalLeaderboardService {

    private final UserRepository userRepository;
    private final SubmissionRepository submissionRepository;

    @Override
    public Page<LeaderboardUserResponse> getGlobalLeaderboard(String search, String type, int page, int size) {
        boolean isTotal = "total".equalsIgnoreCase(type);
        boolean isPractice = "practice".equalsIgnoreCase(type);

        // For "total", sort by globalRating as the best approximation (DB can't sort by derived expression easily)
        // True rank will be calculated correctly using countTotalRank query
        String sortField = isPractice ? "practiceRating" : "globalRating";

        Pageable pageable = PageRequest.of(page, size,
                Sort.by(sortField).descending().and(Sort.by("id").ascending()));

        Page<User> userPage;
        if (search != null && !search.trim().isEmpty()) {
            userPage = userRepository.findByRoleAndEmailContainingIgnoreCaseOrRoleAndFullNameContainingIgnoreCase(
                    UserRole.user, search.trim(), UserRole.user, search.trim(), pageable);
        } else {
            userPage = userRepository.findByRoleAndEmailContainingIgnoreCaseOrRoleAndFullNameContainingIgnoreCase(
                    UserRole.user, "", UserRole.user, "", pageable);
        }

        return userPage.map(user -> {
            Integer userId = user.getId();
            int contestRating = user.getGlobalRating() != null ? user.getGlobalRating() : 0;
            int practiceRating = user.getPracticeRating() != null ? user.getPracticeRating() : 0;

            int displayRating;
            int rankRating; // Dùng để tính hạng
            long trueRank;

            if (isTotal) {
                rankRating = contestRating * 2 + practiceRating;
                displayRating = rankRating; // Hiển thị tổng ELO cho bảng Tổng
                trueRank = userRepository.countTotalRank(UserRole.user, rankRating, userId) + 1;
            } else if (isPractice) {
                rankRating = practiceRating;
                displayRating = practiceRating;
                trueRank = userRepository.countPracticeRank(UserRole.user, rankRating, userId) + 1;
            } else {
                rankRating = contestRating;
                displayRating = contestRating;
                trueRank = userRepository.countGlobalRank(UserRole.user, rankRating, userId) + 1;
            }

            long solvedCount;
            long totalSubs;
            long acSubs;

            if (isTotal) {
                // Tổng hợp: cộng gộp cả bài tập và cuộc thi
                solvedCount = submissionRepository.countDistinctAcceptedProblemsByUserId(userId, SubmissionStatus.AC);
                totalSubs = submissionRepository.countTotalSubmissionsByUserId(userId);
                acSubs = submissionRepository.countAcceptedSubmissionsByUserId(userId, SubmissionStatus.AC);
            } else if (isPractice) {
                solvedCount = submissionRepository.countDistinctAcceptedProblemsPractice(userId, SubmissionStatus.AC);
                totalSubs = submissionRepository.countTotalSubmissionsPractice(userId);
                acSubs = submissionRepository.countAcceptedSubmissionsPractice(userId, SubmissionStatus.AC);
            } else {
                solvedCount = submissionRepository.countDistinctAcceptedProblemsContest(userId, SubmissionStatus.AC);
                totalSubs = submissionRepository.countTotalSubmissionsContest(userId);
                acSubs = submissionRepository.countAcceptedSubmissionsContest(userId, SubmissionStatus.AC);
            }

            double acRate = totalSubs > 0 ? ((double) acSubs / totalSubs) * 100 : 0.0;

            return LeaderboardUserResponse.builder()
                    .rank((int) trueRank)
                    .userId(userId)
                    .username(user.getUsername())
                    .fullName(user.getFullName())
                    .email(user.getEmail())
                    .globalRating(displayRating)
                    .solvedCount(solvedCount)
                    .acRate(Math.round(acRate * 100.0) / 100.0)
                    .avatarUrl(user.getProfile() != null ? user.getProfile().getAvatarUrl() : null)
                    .avatarFrame(user.getProfile() != null ? user.getProfile().getAvatarFrame() : null)
                    .build();
        });
    }
}
