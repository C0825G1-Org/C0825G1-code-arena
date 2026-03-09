package com.codegym.spring_boot.service.impl;

import com.codegym.spring_boot.dto.leaderboard.LeaderboardDTO;
import com.codegym.spring_boot.entity.Contest;
import com.codegym.spring_boot.entity.ContestParticipant;
import com.codegym.spring_boot.entity.ContestParticipantId;
import com.codegym.spring_boot.entity.Submission;
import com.codegym.spring_boot.entity.enums.SubmissionStatus;
import com.codegym.spring_boot.repository.ContestParticipantRepository;
import com.codegym.spring_boot.repository.ITestCaseRepository;
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
    private final ITestCaseRepository testCaseRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final SocketIOServer socketIOServer;

    private static final int PENALTY_MINUTES_PER_FAILED_ATTEMPT = 20;

    @Override
    @Transactional
    public void updateScore(Submission submission, boolean alreadyAC) {
        if (submission.getContest() == null || submission.getIsTestRun()) {
            return;
        }

        Contest contest = submission.getContest();
        Integer contestId = contest.getId();
        Integer userId = submission.getUser().getId();
        Integer problemId = submission.getProblem().getId();

        ContestParticipantId participantId = new ContestParticipantId(contestId, userId);
        participantRepository.findById(participantId).ifPresent(participant -> {
            // 1. LUÔN CẬP NHẬT TỔNG ĐIỂM (totalScore) nếu điểm hiện tại cao hơn điểm cũ
            int maxScoreVal = testCaseRepository.sumScoreWeightByProblemId(problemId);
            int currentScore = Math.min(submission.getScore() != null ? submission.getScore() : 0, maxScoreVal);

            Integer maxScoreBefore = submissionRepository.findMaxScoreBefore(userId, problemId, contestId,
                    submission.getId());
            int prevMax = (maxScoreBefore != null) ? Math.min(maxScoreBefore, maxScoreVal) : 0;

            if (currentScore > prevMax) {
                int scoreDiff = currentScore - prevMax;
                participant.setTotalScore(participant.getTotalScore() + scoreDiff);
                log.info("Total Score updated for userId={} (contestId={}): +{} (Problem {} score: {} -> {})",
                        userId, contestId, scoreDiff, problemId, prevMax, currentScore);
            }

            // 2. CHỈ CẬP NHẬT PENALTY VÀ AC COUNT KHI LẦN ĐẦU AC BÀI NÀY
            if (submission.getStatus() == SubmissionStatus.AC && !alreadyAC) {
                // Tính thời gian giải (phút từ lúc bắt đầu thi)
                LocalDateTime contestStartTime = contest.getStartTime();
                LocalDateTime submissionTime = submission.getCreatedAt() != null ? submission.getCreatedAt()
                        : LocalDateTime.now();
                long minutesPassed = java.time.Duration.between(contestStartTime, submissionTime).toMinutes();
                if (minutesPassed < 0)
                    minutesPassed = 0;

                // Đếm số lần nộp sai thực sự (WA/TLE/MLE/RE) TRƯỚC submission này
                int failedAttempts = submissionRepository.countByUserIdAndProblemIdAndContestIdAndIdLessThanAndStatusIn(
                        userId, problemId, contestId, submission.getId(), java.util.Arrays.asList(
                                SubmissionStatus.WA, SubmissionStatus.TLE, SubmissionStatus.MLE, SubmissionStatus.RE));

                // Penalty = thời_gian_giải + 20ph * lần_sai
                int currentProblemPenalty = (int) minutesPassed + (failedAttempts * PENALTY_MINUTES_PER_FAILED_ATTEMPT);

                participant.setTotalPenalty(participant.getTotalPenalty() + currentProblemPenalty);
                log.info("Total Penalty updated for userId={} (contestId={}): +{} (Problem {} AC)",
                        userId, contestId, currentProblemPenalty, problemId);
            }

            participantRepository.save(participant);
        });

        // 3. Broadcast real-time
        broadcastLeaderboardUpdate(contestId);
    }

    @Override
    public List<LeaderboardDTO> getLeaderboard(Integer contestId) {
        // Lấy từ DB đã sort: totalScore DESC → totalPenalty ASC
        List<ContestParticipant> participants = participantRepository
                .findByIdContestIdOrderByTotalScoreDescTotalPenaltyAsc(contestId);

        // Lấy tất cả submission của contest để tính chi tiết từng bài
        List<Submission> allSubmissions = submissionRepository.findByContestIdOrderByIdAsc(contestId);

        // Map: userId → (problemId → ProblemDetail)
        Map<Integer, Map<Integer, LeaderboardDTO.ProblemDetail>> userProblemDetails = new java.util.HashMap<>();
        for (ContestParticipant p : participants) {
            userProblemDetails.put(p.getUser().getId(), new java.util.HashMap<>());
        }

        // Cache maxScore theo problemId (tổng scoreWeight của tất cả test case)
        Map<Integer, Integer> maxScoreByProblem = new java.util.HashMap<>();

        for (Submission sub : allSubmissions) {
            Integer uid = sub.getUser().getId();
            Integer pid = sub.getProblem().getId();

            if (!userProblemDetails.containsKey(uid))
                continue;

            Map<Integer, LeaderboardDTO.ProblemDetail> pMap = userProblemDetails.get(uid);

            // Tính maxScore cho problem này nếu chưa có
            int maxScore = maxScoreByProblem.computeIfAbsent(pid,
                    id -> testCaseRepository.sumScoreWeightByProblemId(id));

            pMap.putIfAbsent(pid, LeaderboardDTO.ProblemDetail.builder()
                    .problemId(pid)
                    .isAccepted(false)
                    .failedAttempts(0)
                    .solvedTimeMinutes(0)
                    .score(0)
                    .maxScore(maxScore)
                    .penaltyMinutes(0)
                    .build());

            LeaderboardDTO.ProblemDetail detail = pMap.get(pid);

            // Đã AC rồi thì bỏ qua các lần nộp sau (cho mục đích penalty ICPC)
            if (Boolean.TRUE.equals(detail.getIsAccepted()))
                continue;

            if (sub.getStatus() == SubmissionStatus.AC) {
                detail.setIsAccepted(true);
                // score thực tế từ submission, giới hạn bởi maxScore
                int subScore = sub.getScore() != null ? sub.getScore() : maxScore;
                detail.setScore(Math.min(subScore, maxScore));

                LocalDateTime startTime = sub.getContest().getStartTime();
                LocalDateTime subTime = sub.getCreatedAt() != null ? sub.getCreatedAt() : LocalDateTime.now();
                long mins = Duration.between(startTime, subTime).toMinutes();
                detail.setSolvedTimeMinutes((int) Math.max(0, mins));

                // penaltyMinutes ICPC = thời gian giải + 20ph × lần sai (tách riêng khỏi score)
                int problemPenalty = detail.getSolvedTimeMinutes()
                        + (detail.getFailedAttempts() * PENALTY_MINUTES_PER_FAILED_ATTEMPT);
                detail.setPenaltyMinutes(problemPenalty);

            } else if (sub.getStatus() == SubmissionStatus.WA || sub.getStatus() == SubmissionStatus.TLE
                    || sub.getStatus() == SubmissionStatus.MLE || sub.getStatus() == SubmissionStatus.RE) {
                detail.setFailedAttempts(detail.getFailedAttempts() + 1);
                // Cập nhật điểm cao nhất (partial score), giới hạn bởi maxScore
                if (sub.getScore() != null) {
                    int cappedSubScore = Math.min(sub.getScore(), maxScore);
                    if (cappedSubScore > detail.getScore()) {
                        detail.setScore(cappedSubScore);
                    }
                }
            }
        }

        List<LeaderboardDTO> dtoList = participants.stream().map(p -> {
            Integer uid = p.getUser().getId();
            LeaderboardDTO dto = new LeaderboardDTO();
            dto.setUserId(uid);
            dto.setUsername(p.getUser().getUsername());
            dto.setFullName(p.getUser().getFullName());
            if (p.getUser().getProfile() != null) {
                dto.setAvatarUrl(p.getUser().getProfile().getAvatarUrl());
            }

            // totalPenalty từ DB (đã tích lũy đúng: thời gian + 20ph*lần_sai + 1000ph nếu
            // vi phạm)
            dto.setTotalPenalty(p.getTotalPenalty());
            dto.setHasScorePenalty(p.getHasScorePenalty());

            int totalSolvedCount = 0;
            int totalPointsFromProblems = 0;
            List<LeaderboardDTO.ProblemDetail> pDetailsList = new java.util.ArrayList<>();
            if (userProblemDetails.containsKey(uid)) {
                pDetailsList.addAll(userProblemDetails.get(uid).values());
            }

            for (LeaderboardDTO.ProblemDetail pd : pDetailsList) {
                if (Boolean.TRUE.equals(pd.getIsAccepted())) {
                    totalSolvedCount++;
                }
                totalPointsFromProblems += (pd.getScore() != null ? pd.getScore() : 0);
            }

            // totalScore = tổng điểm thực tế từ mọi bài (bao gồm partial WA)
            dto.setTotalSolved(totalSolvedCount);
            dto.setTotalScore(totalPointsFromProblems);
            dto.setProblemDetails(pDetailsList);

            return dto;
        }).sorted((a, b) -> {
            // Sort: Total Score (DESC) -> Total Solved (DESC) -> Total Penalty (ASC)
            if (!b.getTotalScore().equals(a.getTotalScore())) {
                return b.getTotalScore() - a.getTotalScore();
            }
            if (!b.getTotalSolved().equals(a.getTotalSolved())) {
                return b.getTotalSolved() - a.getTotalSolved();
            }
            return a.getTotalPenalty() - b.getTotalPenalty();
        }).collect(Collectors.toList());

        // Gán rank
        for (int i = 0; i < dtoList.size(); i++) {
            dtoList.get(i).setRank(i + 1);
        }

        return dtoList;
    }

    private void broadcastLeaderboardUpdate(Integer contestId) {
        List<LeaderboardDTO> updatedBoard = getLeaderboard(contestId);
        socketIOServer.getBroadcastOperations().sendEvent("leaderboard_update", Map.of(
                "contestId", contestId,
                "leaderboard", updatedBoard));
    }
}
