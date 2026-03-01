package com.codegym.spring_boot.service.impl;

import com.codegym.spring_boot.dto.leaderboard.LeaderboardDTO;
import com.codegym.spring_boot.entity.Contest;
import com.codegym.spring_boot.entity.ContestParticipant;
import com.codegym.spring_boot.entity.ContestParticipantId;
import com.codegym.spring_boot.entity.Submission;
import com.codegym.spring_boot.entity.enums.SubmissionStatus;
import com.codegym.spring_boot.repository.ContestParticipantRepository;
import com.codegym.spring_boot.repository.SubmissionRepository;
import com.codegym.spring_boot.service.ILeaderboardService;
import com.corundumstudio.socketio.SocketIOServer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeaderboardService implements ILeaderboardService {

    private final ContestParticipantRepository participantRepository;
    private final SubmissionRepository submissionRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final SocketIOServer socketIOServer;

    private static final int PENALTY_MINUTES_PER_FAILED_ATTEMPT = 20;

    @Override
    @Transactional
    public void updateScore(Submission submission) {
        if (submission.getContest() == null || submission.getIsTestRun()) {
            return; // Not a contest submission or just a test run
        }

        Contest contest = submission.getContest();
        Integer contestId = contest.getId();
        Integer userId = submission.getUser().getId();
        Integer problemId = submission.getProblem().getId();

        // Check if user has already solved this problem in this contest
        // Avoid adding penalty or score for already AC'd problems
        boolean alreadySolved = submissionRepository.existsByUserIdAndProblemIdAndContestIdAndStatus(
                userId, problemId, contestId, SubmissionStatus.AC);

        // If this submission is AC and they haven't solved it before
        if (submission.getStatus() == SubmissionStatus.AC && !alreadySolved) {
            
            // 1. Calculate time passed since contest start (in minutes)
            LocalDateTime contestStartTime = contest.getStartTime();
            LocalDateTime submissionTime = submission.getCreatedAt() != null ? submission.getCreatedAt() : LocalDateTime.now();
            long minutesPassed = Duration.between(contestStartTime, submissionTime).toMinutes();
            if (minutesPassed < 0) minutesPassed = 0; // Just in case

            // 2. Count failed attempts for this problem before this submission
            int failedAttempts = submissionRepository.countByUserIdAndProblemIdAndContestIdAndIdLessThanAndStatusNot(
                    userId, problemId, contestId, submission.getId(), SubmissionStatus.AC);

            // 3. Calculate ICPC Penalty for this problem
            int currentProblemPenalty = (int) minutesPassed + (failedAttempts * PENALTY_MINUTES_PER_FAILED_ATTEMPT);

            // 4. Update ContestParticipant record in DB
            ContestParticipantId participantId = new ContestParticipantId(contestId, userId);
            participantRepository.findById(participantId).ifPresent(participant -> {
                participant.setTotalScore(participant.getTotalScore() + 1); // Solved one more problem
                participant.setTotalPenalty(participant.getTotalPenalty() + currentProblemPenalty);
                participantRepository.save(participant);

                log.info("Leaderboard updated for contestId={}, userId={}. Score: {}, Penalty: {}",
                        contestId, userId, participant.getTotalScore(), participant.getTotalPenalty());
            });
            
            // Note: If WA/TLE/etc, we don't update DB immediately. 
            // The penalty only applies IF AND WHEN they finally get an AC.

            // 5. Broadcast leaderboard update
            broadcastLeaderboardUpdate(contestId);
        }
    }

    @Override
    public List<LeaderboardDTO> getLeaderboard(Integer contestId) {
        // Fallback to getting directly from DB (already sorted by score DESC, penalty ASC)
        List<ContestParticipant> participants = participantRepository.findByIdContestIdOrderByTotalScoreDescTotalPenaltyAsc(contestId);

        // Map to LeaderboardDTO
        // Note: For full real-time feel, we'll keep it simple and just do a DB query here, 
        // as the data is relatively small, but this can be heavily optimized with Redis later.
        
        List<LeaderboardDTO> dtoList = participants.stream().map(p -> {
            LeaderboardDTO dto = new LeaderboardDTO();
            dto.setUserId(p.getUser().getId());
            dto.setUsername(p.getUser().getUsername());
            dto.setFullName(p.getUser().getFullName());
            dto.setTotalScore(p.getTotalScore());
            dto.setTotalPenalty(p.getTotalPenalty());
            // TODO: In a more advanced version, we would also query details for each problem (e.g. WA count, solve time)
            // But for now, basic ranking is enough
            return dto;
        }).collect(Collectors.toList());

        // Assign ranks
        for (int i = 0; i < dtoList.size(); i++) {
            dtoList.get(i).setRank(i + 1);
        }

        return dtoList;
    }

    private void broadcastLeaderboardUpdate(Integer contestId) {
        // Fetch the latest board and broadcast it
        List<LeaderboardDTO> updatedBoard = getLeaderboard(contestId);
        socketIOServer.getBroadcastOperations().sendEvent("leaderboard_update", Map.of(
                "contestId", contestId,
                "leaderboard", updatedBoard
        ));
    }
}
