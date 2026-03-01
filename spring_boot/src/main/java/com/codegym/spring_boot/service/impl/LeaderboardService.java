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
        // Fallback to getting directly from DB (already sorted by AC count DESC, penalty ASC)
        // Notice that ContestParticipant.totalScore is actually tracking the AC count.
        List<ContestParticipant> participants = participantRepository.findByIdContestIdOrderByTotalScoreDescTotalPenaltyAsc(contestId);

        // Fetch all submissions for this contest to build the problem details and actual points
        List<Submission> allSubmissions = submissionRepository.findByContestIdOrderByIdAsc(contestId);

        // Map: userId -> map of problemId -> ProblemDetail
        Map<Integer, Map<Integer, LeaderboardDTO.ProblemDetail>> userProblemDetails = new java.util.HashMap<>();
        
        // Initialize map for all participants to ensure they show up even with 0 submissions
        for (ContestParticipant p : participants) {
            userProblemDetails.put(p.getUser().getId(), new java.util.HashMap<>());
        }

        for (Submission sub : allSubmissions) {
            Integer uid = sub.getUser().getId();
            Integer pid = sub.getProblem().getId();
            
            if (!userProblemDetails.containsKey(uid)) continue; // ignore non-participants just in case
            
            Map<Integer, LeaderboardDTO.ProblemDetail> pMap = userProblemDetails.get(uid);
            
            pMap.putIfAbsent(pid, LeaderboardDTO.ProblemDetail.builder()
                .problemId(pid)
                .isAccepted(false)
                .failedAttempts(0)
                .solvedTimeMinutes(0)
                .score(0)
                .build());
                
            LeaderboardDTO.ProblemDetail detail = pMap.get(pid);
            
            // If already accepted, ignore further attempts for ICPC penalty purposes
            if (detail.getIsAccepted()) continue;
            
            if (sub.getStatus() == SubmissionStatus.AC) {
                detail.setIsAccepted(true);
                detail.setScore(sub.getScore() != null ? sub.getScore() : 100);
                
                LocalDateTime startTime = sub.getContest().getStartTime();
                LocalDateTime subTime = sub.getCreatedAt() != null ? sub.getCreatedAt() : LocalDateTime.now();
                long mins = Duration.between(startTime, subTime).toMinutes();
                detail.setSolvedTimeMinutes((int) Math.max(0, mins));
            } else {
                detail.setFailedAttempts(detail.getFailedAttempts() + 1);
                // Update score if partial points are higher
                if (sub.getScore() != null && sub.getScore() > detail.getScore()) {
                    detail.setScore(sub.getScore());
                }
            }
        }

        List<LeaderboardDTO> dtoList = participants.stream().map(p -> {
            Integer uid = p.getUser().getId();
            LeaderboardDTO dto = new LeaderboardDTO();
            dto.setUserId(uid);
            dto.setUsername(p.getUser().getUsername());
            dto.setFullName(p.getUser().getFullName());
            
            // Penalty uses DB value
            dto.setTotalPenalty(p.getTotalPenalty());
            
            int totalPoints = 0;
            int totalAcCount = 0;
            List<LeaderboardDTO.ProblemDetail> pDetailsList = new java.util.ArrayList<>();
            if (userProblemDetails.containsKey(uid)) {
                pDetailsList.addAll(userProblemDetails.get(uid).values());
                for (LeaderboardDTO.ProblemDetail pd : pDetailsList) {
                    totalPoints += pd.getScore();
                    if (pd.getIsAccepted() != null && pd.getIsAccepted()) {
                        totalAcCount++;
                    }
                }
            }
            // Explicitly count AC problems for "Solved Count"
            dto.setTotalSolved(totalAcCount);
            // Points
            dto.setTotalScore(totalPoints); 
            dto.setProblemDetails(pDetailsList);
            
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
