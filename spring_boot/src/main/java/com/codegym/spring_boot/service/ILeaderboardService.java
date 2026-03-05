package com.codegym.spring_boot.service;

import com.codegym.spring_boot.dto.leaderboard.LeaderboardDTO;
import com.codegym.spring_boot.entity.Submission;

import java.util.List;

public interface ILeaderboardService {
    /**
     * Updates the user's score and penalty in the contest based on their submission result.
     * Also updates the real-time leaderboard in Redis.
     */
    void updateScore(Submission submission, boolean alreadySolvedThisProblem);

    /**
     * Retrieves the current leaderboard for a specific contest.
     */
    List<LeaderboardDTO> getLeaderboard(Integer contestId);
}
