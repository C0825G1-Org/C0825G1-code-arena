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
    public Page<LeaderboardUserResponse> getGlobalLeaderboard(String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by("globalRating").descending().and(Sort.by("id").ascending()));
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
            int rating = user.getGlobalRating() != null ? user.getGlobalRating() : 0;
            long trueRank = userRepository.countGlobalRank(UserRole.user, rating, userId) + 1;

            long solvedCount = submissionRepository.countDistinctAcceptedProblemsByUserId(userId, SubmissionStatus.AC);
            long totalSubs = submissionRepository.countTotalSubmissionsByUserId(userId);
            long acSubs = submissionRepository.countAcceptedSubmissionsByUserId(userId, SubmissionStatus.AC);
            double acRate = totalSubs > 0 ? ((double) acSubs / totalSubs) * 100 : 0.0;

            return LeaderboardUserResponse.builder()
                    .rank((int) trueRank)
                    .userId(userId)
                    .username(user.getUsername())
                    .fullName(user.getFullName())
                    .email(user.getEmail())
                    .globalRating(user.getGlobalRating() != null ? user.getGlobalRating() : 0)
                    .solvedCount(solvedCount)
                    .acRate(Math.round(acRate * 100.0) / 100.0)
                    .avatarUrl(user.getProfile() != null ? user.getProfile().getAvatarUrl() : null)
                    .build();
        });
    }
}
