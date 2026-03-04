package com.codegym.spring_boot.service.impl;

import com.codegym.spring_boot.dto.JudgeResultMessage;
import com.codegym.spring_boot.dto.SubmissionResultDTO;
import com.codegym.spring_boot.entity.TestCase;
import com.codegym.spring_boot.repository.ITestCaseRepository;
import com.codegym.spring_boot.repository.ISubmissionTestResultRepository;
import com.codegym.spring_boot.repository.ISubmissionTestResultRepository;
import com.codegym.spring_boot.entity.Contest;
import java.time.Duration;
import com.codegym.spring_boot.service.NotificationService;
import com.codegym.spring_boot.entity.SubmissionTestResult;

import com.codegym.spring_boot.dto.JudgeTicket;
import com.codegym.spring_boot.dto.SubmissionResultDTO;
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
import com.codegym.spring_boot.repository.ContestParticipantRepository;
import com.codegym.spring_boot.service.ISubmissionService;
import com.codegym.spring_boot.service.JudgeQueueService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
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
        private final com.codegym.spring_boot.service.ILeaderboardService leaderboardService;

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
                        log.warn("User is not authenticated. Falling back to default user ID = 1");
                        user = userRepository.findById(1)
                                        .orElseThrow(() -> new RuntimeException("Default User (ID=1) không tồn tại."));
                }

                // 2. Prepare dependencies
                Problem problemReference = new Problem();
                problemReference.setId(submitRequestDTO.getProblemId());

                Language languageReference = new Language();
                languageReference.setId(submitRequestDTO.getLanguageId());

                Contest contestReference = null;
                if (submitRequestDTO.getContestId() != null) {
                        // Kiểm tra trạng thái thí sinh
                        var participant = contestParticipantRepository
                                        .findByContestIdAndUserId(submitRequestDTO.getContestId(), user.getId())
                                        .orElseThrow(() -> new IllegalStateException("Bạn chưa đăng ký cuộc thi này."));

                        if (participant.getStatus() != com.codegym.spring_boot.entity.enums.ParticipantStatus.JOINED) {
                                throw new IllegalStateException(
                                                "Bạn đã kết thúc lượt thi hoặc bị truất quyền thi, không thể nộp bài.");
                        }

                        boolean isTestRun = Boolean.TRUE.equals(submitRequestDTO.getIsRunOnly());
                        Integer contestId = submitRequestDTO.getContestId();
                        Integer problemId = submitRequestDTO.getProblemId();

                        if (!isTestRun) {
                                // Giới hạn nộp bài: tối đa 50 lần/bài
                                int submitCount = submissionRepository
                                                .countByUserIdAndProblemIdAndContestIdAndIsTestRunFalse(user.getId(),
                                                                problemId, contestId);
                                if (submitCount >= 50) {
                                        throw new IllegalStateException(
                                                        "Bạn đã đạt giới hạn nộp bài (50 lần) cho bài này. Không thể nộp thêm.");
                                }
                        }

                        contestReference = new Contest();
                        contestReference.setId(contestId);
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

                // 4. Push ticket to Redis Queue - PUSH DIRECTLY (Diagnostic)
                log.info("Pushing ticket to Redis for submission ID: {}", savedSubmission.getId());
                JudgeTicket ticket = new JudgeTicket(
                                savedSubmission.getId(),
                                submitRequestDTO.getProblemId(),
                                submitRequestDTO.getLanguageId(),
                                savedSubmission.getIsTestRun());
                judgeQueueService.pushTicketToQueue(ticket);

                return savedSubmission.getId();
        }

        @Override
        @Transactional(readOnly = true)
        public SubmissionResultDTO getSubmissionResult(Integer id) {
                Submission submission = submissionRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Submission not found with ID: " + id));

                return SubmissionResultDTO.builder()
                                .submissionId(submission.getId().longValue())
                                .status(submission.getStatus().name())
                                .executionTime(submission.getExecutionTime().longValue())
                                .memoryUsed(submission.getMemoryUsed().longValue())
                                .score(submission.getScore())
                                .errorMessage(submission.getErrorMessage())
                                .build();
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
                submission.setStatus(finalStatus);

                // Nếu là trạng thái đang chấm, chỉ cập nhật status và notify UI rồi thoát
                if (finalStatus == SubmissionStatus.judging) {
                        submissionRepository.save(submission);
                        SubmissionResultDTO dto = SubmissionResultDTO.builder()
                                        .submissionId(msg.getSubmissionId())
                                        .problemId(submission.getProblem().getId())
                                        .status(finalStatus.name())
                                        .build();
                        notificationService.sendSubmissionUpdate(msg.getUserId(), dto);
                        return;
                }

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
                                String inputFilename = tcResult.getTestCaseNumber() + ".in";
                                TestCase tcEntity = testCaseRepository.findByProblemIdAndInputFilename(
                                                submission.getProblem().getId(), inputFilename);

                                if (tcEntity != null) {
                                        SubmissionTestResult testResult = SubmissionTestResult.builder()
                                                        .submission(submission)
                                                        .testCase(tcEntity)
                                                        .status(mapDockerStatusToTestCaseStatus(tcResult.getMessage()))
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
                                } else {
                                        log.warn("TestCase not found for problem {} and filename {}",
                                                        submission.getProblem().getId(), inputFilename);
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

                // Lưu error runtime hoặc compiler nếu có vào thẳng Submission entity
                if (msg.getCompileMessage() != null && !msg.getCompileMessage().trim().isEmpty()) {
                        submission.setErrorMessage(msg.getCompileMessage());
                }

                submissionRepository.save(submission);

                // 3. Logic Penalty ACM-ICPC và Leaderboard Realtime
                // 3. Logic Penalty ACM-ICPC và Leaderboard Realtime
                if (submission.getContest() != null && !submission.getIsTestRun()) {
                        leaderboardService.updateScore(submission);
                }

                // 4. Gửi Socket về ReactJS realtime
                // Nếu là chạy thử, gửi kèm kết quả từng test case (để hiển thị output thực tế)
                List<SubmissionResultDTO.TestCaseResultDTO> tcResultDTOs = null;
                if (Boolean.TRUE.equals(submission.getIsTestRun()) && msg.getTestCaseResults() != null) {
                        tcResultDTOs = msg.getTestCaseResults().stream().map(tcResult -> {
                                String inputFilename = tcResult.getTestCaseNumber() + ".in";
                                TestCase tcEntity = testCaseRepository.findByProblemIdAndInputFilename(
                                                submission.getProblem().getId(), inputFilename);

                                String input = tcEntity != null ? tcEntity.getSampleInput() : null;
                                String expectedOutput = tcEntity != null ? tcEntity.getSampleOutput() : null;
                                boolean isSample = tcEntity != null && Boolean.TRUE.equals(tcEntity.getIsSample());
                                String actualStatus = tcResult.isPassed() ? "AC"
                                                : (tcResult.getMessage() != null ? tcResult.getMessage() : "WA");

                                return SubmissionResultDTO.TestCaseResultDTO.builder()
                                                .id(tcEntity != null ? tcEntity.getId() : null)
                                                .status(actualStatus)
                                                .isSample(isSample)
                                                .input(input)
                                                .actualOutput(tcResult.getUserOutput())
                                                .expectedOutput(isSample ? expectedOutput : null) // Ẩn expected của
                                                                                                  // test ẩn
                                                .executionTime(tcResult.getExecutionTime())
                                                .build();
                        }).collect(Collectors.toList());
                }

                SubmissionResultDTO dto = SubmissionResultDTO.builder()
                                .submissionId(msg.getSubmissionId())
                                .problemId(submission.getProblem().getId())
                                .contestId(submission.getContest() != null ? submission.getContest().getId() : null)
                                .status(finalStatus.name())
                                .executionTime(submission.getExecutionTime().longValue())
                                .memoryUsed(submission.getMemoryUsed().longValue())
                                .score(submission.getScore())
                                .isRunOnly(submission.getIsTestRun())
                                .testCaseResults(tcResultDTOs)
                                .build();
                notificationService.sendSubmissionUpdate(msg.getUserId(), dto);

                // --- Gửi Socket cho Live Monitor của Moderator ---
                if (submission.getContest() != null && !Boolean.TRUE.equals(submission.getIsTestRun())) {
                        com.codegym.spring_boot.dto.moderator.response.MonitorDashboardResponse.MonitorSubmissionLog logEntry = 
                                com.codegym.spring_boot.dto.moderator.response.MonitorDashboardResponse.MonitorSubmissionLog.builder()
                                        .submissionId(submission.getId())
                                        .username(submission.getUser().getUsername())
                                        .problemId(submission.getProblem().getId())
                                        .problemTitle(submission.getProblem().getTitle())
                                        .status(finalStatus.name())
                                        .score(submission.getScore())
                                        .submittedAt(submission.getCreatedAt().toString())
                                        .build();
                        notificationService.sendToMonitor(submission.getContest().getId(), logEntry);

                        // Lấy top 5 cập nhật mới nhất để đẩy về Leaderboard Table
                        java.util.List<com.codegym.spring_boot.entity.ContestParticipant> topParticipants =
                                contestParticipantRepository.findByIdContestIdOrderByTotalScoreDescTotalPenaltyAsc(submission.getContest().getId())
                                        .stream().limit(5).collect(Collectors.toList());

                        java.util.List<com.codegym.spring_boot.dto.moderator.response.MonitorDashboardResponse.MonitorLeaderboardEntry> leaderboard = new java.util.ArrayList<>();
                        int rank = 1;
                        for (var p : topParticipants) {
                                String fullname = p.getUser().getFullName() != null ? p.getUser().getFullName() : p.getUser().getUsername();
                                
                                double acRate = 0.0;
                                long totalUserSubs = submissionRepository.countByUserIdAndContestId(p.getUser().getId(), submission.getContest().getId());
                                if(totalUserSubs > 0){
                                        long acUserSubs = submissionRepository.countByUserIdAndContestIdAndStatus(p.getUser().getId(), submission.getContest().getId(), SubmissionStatus.AC);
                                        acRate = (double) acUserSubs / totalUserSubs * 100.0;
                                }

                                leaderboard.add(com.codegym.spring_boot.dto.moderator.response.MonitorDashboardResponse.MonitorLeaderboardEntry.builder()
                                        .rank(rank++)
                                        .userId(p.getUser().getId().longValue())
                                        .username(p.getUser().getUsername())
                                        .fullname(fullname)
                                        .totalScore(p.getTotalScore())
                                        .totalPenalty(p.getTotalPenalty())
                                        .acRate(Math.round(acRate * 100.0) / 100.0)
                                        .build());
                        }
                        notificationService.sendLeaderboardUpdateToMonitor(submission.getContest().getId(), leaderboard);
                }

        }

        private SubmissionStatus mapDockerStatusToTestCaseStatus(String status) {
                if (status == null)
                        return SubmissionStatus.RE;
                return switch (status) {
                        case "SUCCESS" -> SubmissionStatus.AC;
                        case "WA", "WRONG_ANSWER" -> SubmissionStatus.WA;
                        case "TLE", "TIME_LIMIT_EXCEEDED" -> SubmissionStatus.TLE;
                        case "MLE", "MEMORY_LIMIT_EXCEEDED" -> SubmissionStatus.MLE;
                        default -> SubmissionStatus.RE;
                };
        }

        private SubmissionStatus mapDockerStatusToSubmissionStatus(String dockerStatus) {
                if (dockerStatus == null)
                        return SubmissionStatus.RE;
                switch (dockerStatus) {
                        case "ACCEPTED":
                                return SubmissionStatus.AC;
                        case "judging":
                                return SubmissionStatus.judging;
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
                                                .actualOutput(tr.getTestCase().getIsSample()
                                                                ? tr.getUserOutput()
                                                                : null)
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
