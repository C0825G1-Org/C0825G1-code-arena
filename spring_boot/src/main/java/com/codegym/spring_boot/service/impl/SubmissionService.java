package com.codegym.spring_boot.service.impl;

import com.codegym.spring_boot.dto.JudgeResultMessage;
import com.codegym.spring_boot.dto.SubmissionResultDTO;
import com.codegym.spring_boot.entity.TestCase;
import com.codegym.spring_boot.repository.ITestCaseRepository;
import com.codegym.spring_boot.repository.ISubmissionTestResultRepository;
import com.codegym.spring_boot.repository.ContestParticipantRepository;
import com.codegym.spring_boot.entity.Contest;
import java.time.Duration;
import com.codegym.spring_boot.service.ITestCaseService;
import com.codegym.spring_boot.service.judge.JudgeCoreProcessor;
import com.codegym.spring_boot.service.NotificationService;
import com.codegym.spring_boot.entity.SubmissionTestResult;

import com.codegym.spring_boot.dto.JudgeTicket;
import com.codegym.spring_boot.dto.SubmitRequestDTO;
import com.codegym.spring_boot.dto.SubmissionHistoryDTO;
import java.util.stream.Collectors;
import com.codegym.spring_boot.entity.Language;
import com.codegym.spring_boot.entity.Problem;
import com.codegym.spring_boot.entity.Submission;
import com.codegym.spring_boot.entity.User;
import com.codegym.spring_boot.entity.enums.SubmissionStatus;
import com.codegym.spring_boot.repository.UserRepository;
import com.codegym.spring_boot.repository.SubmissionRepository;
import com.codegym.spring_boot.service.ISubmissionService;
import com.codegym.spring_boot.service.JudgeQueueService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubmissionService implements ISubmissionService {

        private final SubmissionRepository submissionRepository;
        private final JudgeQueueService judgeQueueService;
        private final UserRepository userRepository;
        private final ITestCaseRepository testCaseRepository;
        private final ITestCaseService testCaseService;
        private final JudgeCoreProcessor judgeCoreProcessor;
        private final ISubmissionTestResultRepository submissionTestResultRepository;
        private final ContestParticipantRepository contestParticipantRepository;
        private final NotificationService notificationService;

        @Override
        @Transactional
        public Integer submitCode(SubmitRequestDTO submitRequestDTO) {
                log.info("Receiving new code submission for problem ID: {}", submitRequestDTO.getProblemId());

                // 1. Get current user from Security Context
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                User user = null;
                if (authentication != null && authentication.isAuthenticated()
                                && !authentication.getPrincipal().equals("anonymousUser")) {
                        String username = authentication.getName();
                        user = userRepository.findByUsernameAndIsDeletedFalse(username)
                                        .orElseThrow(() -> new RuntimeException("Current user not found"));
                } else {
                        // TODO: Fallback to a hardcoded user if Auth (Dev 1) is not fully integrated
                        // yet for testing
                        log.warn("User is not authenticated. Falling back to default user ID = 1");
                        user = userRepository.findById(1)
                                        .orElseThrow(() -> new RuntimeException("Default user not found"));
                }

                // 2. Prepare dependencies (Using dummy instances for problem and language just
                // to hold IDs for saving foreign keys, ideally we should fetch them)
                // Note: For a real stable application, fetch the Problem and Language to ensure
                // they exist before inserting.
                Problem problemReference = new Problem();
                problemReference.setId(submitRequestDTO.getProblemId());

                Language languageReference = new Language();
                languageReference.setId(submitRequestDTO.getLanguageId());

                // 3. Save Submission to DB with PENDING status
                Submission newSubmission = Submission.builder()
                                .user(user)
                                .problem(problemReference)
                                .language(languageReference)
                                .sourceCode(submitRequestDTO.getSourceCode())
                                .status(SubmissionStatus.pending)
                                .executionTime(0)
                                .memoryUsed(0)
                                .score(0)
                                .build();

                Submission savedSubmission = submissionRepository.save(newSubmission);
                log.info("Saved submission to DB with ID: {}", savedSubmission.getId());

                // 4. Push ticket to Redis Queue for the Judge Engine (Dev 3) to pick up
                JudgeTicket ticket = new JudgeTicket(
                                savedSubmission.getId(),
                                submitRequestDTO.getProblemId(),
                                submitRequestDTO.getLanguageId());
                judgeQueueService.pushTicketToQueue(ticket);

                return savedSubmission.getId();
        }

        @Override
        @Transactional
        public void processJudgeResult(JudgeResultMessage msg) {
                log.info("Processing judge result for submission ID: {}", msg.getSubmissionId());

                Submission submission = submissionRepository.findById(msg.getSubmissionId().intValue())
                                .orElse(null);
                if (submission == null) {
                        log.error("Submission not found: {}", msg.getSubmissionId());
                        return;
                }

                TestCase testCase = null;
                if (msg.getTestCaseId() != null && msg.getTestCaseId() > 0) {
                        testCase = testCaseRepository.findById(msg.getTestCaseId().intValue()).orElse(null);
                }

                // 1. So khớp kết quả
                JudgeCoreProcessor.ProcessedResult result;
                if (testCase != null) {
                        String expectedOutput = testCaseService.getExpectedOutput(testCase.getId());
                        result = judgeCoreProcessor.processTestCase(msg, expectedOutput);
                } else {
                        // CE hoặc RE không có test case id
                        result = judgeCoreProcessor.processTestCase(msg, "");
                }

                // 2. Lưu TestResult
                if (testCase != null) {
                        SubmissionTestResult testResult = SubmissionTestResult.builder()
                                        .submission(submission)
                                        .testCase(testCase)
                                        .status(result.status())
                                        .executionTime(msg.getExecutionTime() != null
                                                        ? msg.getExecutionTime().intValue()
                                                        : 0)
                                        .memoryUsed(msg.getMemoryUsed() != null ? msg.getMemoryUsed().intValue() : 0)
                                        .userOutput(msg.getStdout())
                                        .errorMessage(result.errorMessage())
                                        .build();
                        submissionTestResultRepository.save(testResult);
                }

                // 3. Fail-fast: Cập nhật DB trạng thái tổng
                int currentMaxTime = submission.getExecutionTime() != null ? submission.getExecutionTime() : 0;
                int currentMaxMemory = submission.getMemoryUsed() != null ? submission.getMemoryUsed() : 0;
                int newTime = msg.getExecutionTime() != null ? msg.getExecutionTime().intValue() : 0;
                int newMemory = msg.getMemoryUsed() != null ? msg.getMemoryUsed().intValue() : 0;

                submission.setExecutionTime(Math.max(currentMaxTime, newTime));
                submission.setMemoryUsed(Math.max(currentMaxMemory, newMemory));

                // Note: Logic thật sẽ có biến đếm test case AC, nếu count == total => AC toàn
                // bài.
                // Ở đây tạm set luôn status để báo UI
                submission.setStatus(result.status());
                submissionRepository.save(submission);

                // --- 4. Logic Penalty ACM-ICPC (Chỉ áp dụng khi AC và nằm trong Contest) ---
                if (result.status() == SubmissionStatus.AC && submission.getContest() != null) {
                        Integer contestId = submission.getContest().getId();
                        Integer userId = submission.getUser().getId();
                        Integer problemId = submission.getProblem().getId();

                        // 4.1: Kiểm tra xem User đã từng AC bài này xưa kia chưa? Nếu chưa thì tính
                        // điểm.
                        boolean alreadyAC = submissionRepository.existsByUserIdAndProblemIdAndContestIdAndStatus(
                                        userId, problemId, contestId, SubmissionStatus.AC);

                        // Chỉ cập nhật Penalty nếu đây là lần ĐẦU TIÊN User AC bài này trong kỳ thi.
                        if (!alreadyAC) {

                                Integer currentSubId = submission.getId();
                                // Giả lập logic: Gọi repo tìm xem CÓ BÀI NÀO AC TRƯỚC ĐÓ HAY CHƯA.
                                // Để đơn giản (trong demo này):
                                // Tính Penalty nếu đây là lần AC đầu tiên.
                                // TODO: Update exist query to check "id < currentSubId".
                                // Logic Penalty nháp:
                                Contest contest = submission.getContest();
                                if (contest.getStartTime() != null && submission.getCreatedAt() != null) {
                                        // Tính Penalty 1: Thời gian từ lúc bắt đầu thi đến khi nộp AC (tính bằng giây)
                                        long minutesFromStart = Duration
                                                        .between(contest.getStartTime(), submission.getCreatedAt())
                                                        .toMinutes();

                                        // Đếm số lần nộp sai trước đó (mỗi lần sai + 20 phút)
                                        int failedAttempts = submissionRepository
                                                        .countByUserIdAndProblemIdAndContestIdAndIdLessThanAndStatusNot(
                                                                        userId, problemId, contestId, currentSubId,
                                                                        SubmissionStatus.AC);

                                        long penaltyMinutes = minutesFromStart + (failedAttempts * 20L);

                                        // Cập nhật Participant
                                        contestParticipantRepository.findByContestIdAndUserId(contestId, userId)
                                                        .ifPresent(p -> {
                                                                p.setTotalScore(p.getTotalScore() + 1);
                                                                p.setTotalPenalty(p.getTotalPenalty()
                                                                                + (int) penaltyMinutes);
                                                                contestParticipantRepository.save(p);
                                                                log.info("Cập nhật Penalty ICPC User {} - Tăng {} điểm, Penalty: {} phút",
                                                                                userId, 1, penaltyMinutes);
                                                        });
                                }
                        }
                }

                // 5. Gửi Socket về ReactJS
                SubmissionResultDTO dto = SubmissionResultDTO.builder()
                                .submissionId(msg.getSubmissionId())
                                .status(result.status().name())
                                .executionTime(submission.getExecutionTime().longValue())
                                .memoryUsed(submission.getMemoryUsed().longValue())
                                .score(submission.getScore())
                                .build();
                notificationService.sendSubmissionUpdate(msg.getUserId(), dto);
        }

        @Override
        @Transactional(readOnly = true)
        public java.util.List<SubmissionHistoryDTO> getHistoryByProblem(Integer problemId) {
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                User user = null;
                if (authentication != null && authentication.isAuthenticated()
                                && !authentication.getPrincipal().equals("anonymousUser")) {
                        String username = authentication.getName();
                        user = userRepository.findByUsernameAndIsDeletedFalse(username)
                                        .orElseThrow(() -> new RuntimeException("Current user not found"));
                } else {
                        log.warn("User is not authenticated. Returning empty history.");
                        // fallback to empty or throw 401
                        return java.util.Collections.emptyList();
                }

                java.util.List<Submission> submissions = submissionRepository
                                .findByUserIdAndProblemIdOrderByIdDesc(user.getId(), problemId);

                return submissions.stream().map(sub -> SubmissionHistoryDTO.builder()
                                .id(sub.getId())
                                .status(sub.getStatus().name())
                                .executionTime(sub.getExecutionTime())
                                .memoryUsed(sub.getMemoryUsed())
                                .score(sub.getScore())
                                .createdAt(sub.getCreatedAt())
                                .build()).collect(Collectors.toList());
        }
}
