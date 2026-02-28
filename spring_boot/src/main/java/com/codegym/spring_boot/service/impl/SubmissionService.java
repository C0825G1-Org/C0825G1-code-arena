package com.codegym.spring_boot.service.impl;

import com.codegym.spring_boot.dto.JudgeResultMessage;
import com.codegym.spring_boot.dto.SubmissionResultDTO;
import com.codegym.spring_boot.entity.TestCase;
import com.codegym.spring_boot.repository.ITestCaseRepository;
import com.codegym.spring_boot.repository.ISubmissionTestResultRepository;
import com.codegym.spring_boot.repository.ContestParticipantRepository;
import com.codegym.spring_boot.entity.Contest;
import java.time.Duration;
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
import java.util.List;
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
                                        .orElseThrow(() -> new RuntimeException(
                                                        "Không tìm thấy thông tin người dùng hiện tại."));
                } else {
                        throw new SecurityException("Bạn phải đăng nhập để nộp bài.");
                }

                // 2. Prepare dependencies (Using dummy instances for problem and language just
                // to hold IDs for saving foreign keys, ideally we should fetch them)
                // Note: For a real stable application, fetch the Problem and Language to ensure
                // they exist before inserting.
                Problem problemReference = new Problem();
                problemReference.setId(submitRequestDTO.getProblemId());

                Language languageReference = new Language();
                languageReference.setId(submitRequestDTO.getLanguageId());

                Contest contestReference = null;
                if (submitRequestDTO.getContestId() != null) {
                        contestReference = new Contest();
                        contestReference.setId(submitRequestDTO.getContestId());
                }

                // 3. Save Submission to DB with PENDING status
                Submission newSubmission = Submission.builder()
                                .user(user)
                                .problem(problemReference)
                                .contest(contestReference)
                                .language(languageReference)
                                .sourceCode(submitRequestDTO.getSourceCode())
                                .status(SubmissionStatus.pending)
                                .executionTime(0)
                                .memoryUsed(0)
                                .score(0)
                                .isTestRun(submitRequestDTO.getIsRunOnly() != null ? submitRequestDTO.getIsRunOnly()
                                                : false)
                                .build();

                Submission savedSubmission = submissionRepository.save(newSubmission);
                log.info("Saved submission to DB with ID: {}", savedSubmission.getId());

                // 4. Push ticket to Redis Queue for the Judge Engine (Dev 3) to pick up
                JudgeTicket ticket = new JudgeTicket(
                                savedSubmission.getId(),
                                submitRequestDTO.getProblemId(),
                                submitRequestDTO.getLanguageId(),
                                savedSubmission.getIsTestRun());
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

                SubmissionStatus finalStatus = mapDockerStatusToSubmissionStatus(msg.getStatus());

                // Kiểm tra trước khi lưu để xác định Penalty
                boolean alreadyAC = false;
                if (submission.getContest() != null) {
                        alreadyAC = submissionRepository.existsByUserIdAndProblemIdAndContestIdAndStatus(
                                        submission.getUser().getId(), submission.getProblem().getId(),
                                        submission.getContest().getId(), SubmissionStatus.AC);
                }

                // 1. Lưu TestResult chi tiết
                if (msg.getTestCaseResults() != null) {
                        for (com.codegym.spring_boot.dto.TestCaseResult tcResult : msg.getTestCaseResults()) {
                                TestCase testCase = testCaseRepository.findById(tcResult.getTestCaseNumber())
                                                .orElse(null);
                                if (testCase != null) {
                                        SubmissionTestResult testResult = SubmissionTestResult.builder()
                                                        .submission(submission)
                                                        .testCase(testCase)
                                                        .status(tcResult.isPassed() ? SubmissionStatus.AC
                                                                        : mapDockerStatusToSubmissionStatus(
                                                                                        tcResult.getMessage()))
                                                        .executionTime(tcResult.getExecutionTime() != null
                                                                        ? tcResult.getExecutionTime().intValue()
                                                                        : 0)
                                                        .memoryUsed(tcResult.getMemoryUsed() != null
                                                                        ? tcResult.getMemoryUsed().intValue()
                                                                        : 0)
                                                        .userOutput(tcResult.getUserOutput())
                                                        .errorMessage(tcResult.isPassed() ? null
                                                                        : tcResult.getMessage())
                                                        .build();
                                        submissionTestResultRepository.save(testResult);
                                }
                        }
                }

                // 2. Cập nhật DB trạng thái tổng cục
                submission.setExecutionTime(msg.getExecutionTime() != null ? msg.getExecutionTime().intValue() : 0);
                submission.setMemoryUsed(msg.getMemoryUsed() != null ? msg.getMemoryUsed().intValue() : 0);

                int score = 0;
                if (finalStatus == SubmissionStatus.AC) {
                        score = 100;
                } else if (msg.getTestCaseResults() != null && !msg.getTestCaseResults().isEmpty()) {
                        long passedCount = msg.getTestCaseResults().stream()
                                        .filter(com.codegym.spring_boot.dto.TestCaseResult::isPassed).count();
                        score = (int) ((passedCount * 100) / msg.getTestCaseResults().size());
                }
                submission.setScore(score);
                submission.setStatus(finalStatus);

                // Lưu error runtime hoặc compiler nếu có
                if (msg.getCompileMessage() != null && !msg.getCompileMessage().trim().isEmpty()
                                && finalStatus != SubmissionStatus.AC) {
                        SubmissionTestResult compileErrorLog = SubmissionTestResult.builder()
                                        .submission(submission)
                                        .status(finalStatus)
                                        .errorMessage(msg.getCompileMessage())
                                        .build();
                        submissionTestResultRepository.save(compileErrorLog);
                }

                submissionRepository.save(submission);

                // --- 3. Logic Penalty ACM-ICPC (Chỉ áp dụng khi AC, nằm trong Contest và KHÔNG
                // PHẢI CHẠY THỬ) ---
                if (finalStatus == SubmissionStatus.AC && submission.getContest() != null
                                && !submission.getIsTestRun()) {
                        Integer contestId = submission.getContest().getId();
                        Integer userId = submission.getUser().getId();
                        Integer problemId = submission.getProblem().getId();

                        // Chỉ cập nhật Penalty nếu đây là lần ĐẦU TIÊN User AC bài này trong kỳ thi.
                        if (!alreadyAC) {
                                Contest contest = submission.getContest();
                                if (contest.getStartTime() != null && submission.getCreatedAt() != null) {
                                        long minutesFromStart = Duration
                                                        .between(contest.getStartTime(), submission.getCreatedAt())
                                                        .toMinutes();

                                        int failedAttempts = submissionRepository
                                                        .countByUserIdAndProblemIdAndContestIdAndIdLessThanAndStatusNot(
                                                                        userId, problemId, contestId,
                                                                        submission.getId(),
                                                                        SubmissionStatus.AC);

                                        long penaltyMinutes = minutesFromStart + (failedAttempts * 20L);

                                        contestParticipantRepository.findByContestIdAndUserId(contestId, userId)
                                                        .ifPresent(p -> {
                                                                p.setTotalScore(p.getTotalScore() + 1);
                                                                p.setTotalPenalty(p.getTotalPenalty()
                                                                                + (int) penaltyMinutes);
                                                                contestParticipantRepository.save(p);
                                                                log.info("Cập nhật Penalty ICPC User {} - Tăng 1 điểm, Penalty: {} phút",
                                                                                userId, penaltyMinutes);
                                                        });
                                }
                        }
                }

                // 4. Gửi Socket về ReactJS realtime
                SubmissionResultDTO dto = SubmissionResultDTO.builder()
                                .submissionId(msg.getSubmissionId())
                                .problemId(submission.getProblem().getId())
                                .contestId(submission.getContest() != null ? submission.getContest().getId() : null)
                                .status(finalStatus.name())
                                .executionTime(submission.getExecutionTime().longValue())
                                .memoryUsed(submission.getMemoryUsed().longValue())
                                .score(submission.getScore())
                                .isRunOnly(submission.getIsTestRun())
                                .build();
                notificationService.sendSubmissionUpdate(msg.getUserId(), dto);
        }

        private SubmissionStatus mapDockerStatusToSubmissionStatus(String dockerStatus) {
                if (dockerStatus == null)
                        return SubmissionStatus.RE;
                switch (dockerStatus) {
                        case "ACCEPTED":
                        case "SUCCESS":
                                return SubmissionStatus.AC;
                        case "RUNTIME_ERROR":
                                return SubmissionStatus.RE;
                        case "COMPILE_ERROR":
                                return SubmissionStatus.CE;
                        case "TIME_LIMIT_EXCEEDED":
                        case "TLE":
                                return SubmissionStatus.TLE;
                        case "MEMORY_LIMIT_EXCEEDED":
                        case "MLE":
                                return SubmissionStatus.MLE;
                        case "WRONG_ANSWER":
                        case "WA":
                                return SubmissionStatus.WA;
                        default:
                                return SubmissionStatus.RE;
                }
        }

        @Override
        @Transactional(readOnly = true)
        public java.util.List<SubmissionHistoryDTO> getHistoryByProblem(Integer problemId, Integer contestId) {
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

                java.util.List<Submission> submissions;

                if (contestId != null) {
                        submissions = submissionRepository.findByUserIdAndProblemIdAndContestIdOrderByIdDesc(
                                        user.getId(), problemId, contestId);
                } else {
                        submissions = submissionRepository
                                        .findByUserIdAndProblemIdAndContestIsNullOrderByIdDesc(user.getId(), problemId);
                }

                return submissions.stream().map(sub -> SubmissionHistoryDTO.builder()
                                .id(sub.getId())
                                .status(sub.getStatus().name())
                                .executionTime(sub.getExecutionTime())
                                .memoryUsed(sub.getMemoryUsed())
                                .score(sub.getScore())
                                .createdAt(sub.getCreatedAt())
                                .build()).collect(Collectors.toList());
        }

        @Override
        @Transactional(readOnly = true)
        public com.codegym.spring_boot.dto.SubmissionDetailDTO getSubmissionDetail(Integer submissionId) {
                Submission submission = submissionRepository.findById(submissionId)
                                .orElseThrow(() -> new jakarta.persistence.NoResultException(
                                                "Không tìm thấy bài nộp ID: " + submissionId));

                // Bảo mật: Kiểm tra xem bài nộp có thuộc về user hiện tại không
                Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                String username = auth.getName();
                if (!submission.getUser().getUsername().equals(username)) {
                        // Trừ khi là MOD hoặc ADMIN (Tạm thời check đơn giản, Dev 1 có thể mở rộng)
                        boolean isAdmin = auth.getAuthorities().stream()
                                        .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")
                                                        || a.getAuthority().equals("ROLE_MODERATOR"));
                        if (!isAdmin) {
                                throw new SecurityException("Bạn không có quyền xem bài nộp của người khác.");
                        }
                }

                // Lấy danh sách kết quả chi tiết từng testcase
                List<SubmissionTestResult> testResults = submissionTestResultRepository
                                .findBySubmissionId(submissionId);

                List<com.codegym.spring_boot.dto.TestCaseResultDetailDTO> detailTCs = testResults.stream()
                                .map(tr -> com.codegym.spring_boot.dto.TestCaseResultDetailDTO.builder()
                                                .id(tr.getId())
                                                .status(tr.getStatus().name())
                                                .executionTime(tr.getExecutionTime())
                                                .memoryUsed(tr.getMemoryUsed())
                                                .isSample(tr.getTestCase().getIsSample())
                                                .input(tr.getTestCase().getIsSample()
                                                                ? tr.getTestCase().getSampleInput()
                                                                : null)
                                                .expectedOutput(tr.getTestCase().getIsSample()
                                                                ? tr.getTestCase().getSampleOutput()
                                                                : null)
                                                .actualOutput(tr.getUserOutput())
                                                .errorMessage(tr.getErrorMessage())
                                                .build())
                                .collect(Collectors.toList());

                return com.codegym.spring_boot.dto.SubmissionDetailDTO.builder()
                                .id(submission.getId())
                                .status(submission.getStatus().name())
                                .score(submission.getScore())
                                .executionTime(submission.getExecutionTime())
                                .memoryUsed(submission.getMemoryUsed())
                                .sourceCode(submission.getSourceCode())
                                .createdAt(submission.getCreatedAt())
                                .isTestRun(submission.getIsTestRun())
                                .testCaseResults(detailTCs)
                                .build();
        }
}
