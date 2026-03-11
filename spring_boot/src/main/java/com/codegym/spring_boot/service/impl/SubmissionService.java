package com.codegym.spring_boot.service.impl;

import com.codegym.spring_boot.dto.JudgeResultMessage;
import com.codegym.spring_boot.dto.SubmissionResultDTO;
import com.codegym.spring_boot.entity.TestCase;
import com.codegym.spring_boot.repository.ITestCaseRepository;
import com.codegym.spring_boot.entity.SubmissionTestResult;
import com.codegym.spring_boot.entity.enums.SubmissionStatus;
import com.codegym.spring_boot.dto.TestCaseResultDetailDTO;
import com.codegym.spring_boot.dto.SubmissionDetailDTO;
import com.codegym.spring_boot.repository.ISubmissionTestResultRepository;
import com.codegym.spring_boot.entity.Contest;
import com.codegym.spring_boot.service.NotificationService;

import com.codegym.spring_boot.dto.JudgeTicket;
import com.codegym.spring_boot.dto.SubmitRequestDTO;
import com.codegym.spring_boot.dto.SubmissionHistoryDTO;
import java.util.stream.Collectors;
import com.codegym.spring_boot.entity.Language;
import com.codegym.spring_boot.entity.Problem;
import com.codegym.spring_boot.entity.Submission;
import com.codegym.spring_boot.entity.User;
import com.codegym.spring_boot.repository.UserRepository;
import com.codegym.spring_boot.repository.SubmissionRepository;
import com.codegym.spring_boot.repository.ContestParticipantRepository;
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

                log.info(">>> [SUBMIT] Start saving submission to DB...");
                Submission savedSubmission = submissionRepository.save(newSubmission);
                log.info(">>> [SUBMIT] Saved to DB with ID: {}", savedSubmission.getId());

                // 4. Push ticket to Redis Queue
                log.info(">>> [SUBMIT] Creating JudgeTicket for ID: {}", savedSubmission.getId());
                JudgeTicket ticket = new JudgeTicket(
                                savedSubmission.getId(),
                                submitRequestDTO.getProblemId(),
                                submitRequestDTO.getLanguageId(),
                                savedSubmission.getIsTestRun());

                log.info(">>> [SUBMIT] Pushing ticket to Redis queue...");
                judgeQueueService.pushTicketToQueue(ticket);
                log.info(">>> [SUBMIT] Pushed successfully. Returning ID: {}", savedSubmission.getId());

                return savedSubmission.getId();
        }

        @Override
        @Transactional(readOnly = true)
        public SubmissionResultDTO getSubmissionResult(Integer id) {
                Submission submission = submissionRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Submission not found with ID: " + id));

                return SubmissionResultDTO.builder()
                                .submissionId(submission.getId().longValue())
                                .status(submission.getStatus() != null ? submission.getStatus().name()
                                                : com.codegym.spring_boot.entity.enums.SubmissionStatus.pending.name())
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

                // CRITICAL: Kiểm tra alreadyAC TRƯỚC KHI setStatus() để tránh JPA auto-flush.
                // Nếu setStatus(AC) trước → entity bị dirty → Hibernate auto-flush trước query
                // → query luôn tìm thấy bản thân submission vừa flush → alreadyAC = true sai.
                boolean alreadyAC = false;
                if (submission.getContest() != null) {
                        alreadyAC = submissionRepository.existsByUserIdAndProblemIdAndContestIdAndStatus(
                                        submission.getUser().getId(), submission.getProblem().getId(),
                                        submission.getContest().getId(), SubmissionStatus.AC);
                }

                submission.setStatus(finalStatus);

                // Nếu là trạng thái đang chấm, chỉ cập nhật status và notify UI rồi thoát
                if (finalStatus == SubmissionStatus.judging) {
                        submissionRepository.save(submission);
                        SubmissionResultDTO dto = SubmissionResultDTO.builder()
                                        .submissionId(msg.getSubmissionId())
                                        .problemId(submission.getProblem().getId())
                                        .status(finalStatus != null ? finalStatus.name()
                                                        : com.codegym.spring_boot.entity.enums.SubmissionStatus.pending
                                                                        .name())
                                        .build();
                        notificationService.sendSubmissionUpdate(msg.getUserId(), dto);
                        return;
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
                if (msg.getTestCaseResults() != null && !msg.getTestCaseResults().isEmpty()) {
                        // Tính điểm = tổng scoreWeight của test case pass (không normalize)
                        // AC = tất cả test pass → score = tổng scoreWeight (ví dụ 100 nếu sum = 100)
                        // WA partial → score = scoreWeight của các test đã pass
                        int passedWeight = 0;
                        for (com.codegym.spring_boot.dto.TestCaseResult tcResult : msg.getTestCaseResults()) {
                                if (!tcResult.isPassed())
                                        continue;
                                String inputFilename = tcResult.getTestCaseNumber() + ".in";
                                TestCase tcEntity = testCaseRepository.findByProblemIdAndInputFilename(
                                                submission.getProblem().getId(), inputFilename);
                                if (tcEntity != null) {
                                        int weight = (tcEntity.getScoreWeight() != null)
                                                        ? tcEntity.getScoreWeight()
                                                        : 1; // Mặc định 1 nếu null trong DB
                                        passedWeight += weight;
                                } else {
                                        log.warn("[JudgeScore] Skipping weight for unknown TC: {}", inputFilename);
                                }
                        }
                        score = passedWeight;
                } else if (finalStatus == SubmissionStatus.AC) {
                        // Không có test case results (trường hợp đặc biệt) → full score mặc định
                        score = 100;
                }

                submission.setScore(score);
                submission.setStatus(finalStatus);

                // Lưu error runtime hoặc compiler nếu có vào thẳng Submission entity
                if (msg.getCompileMessage() != null && !msg.getCompileMessage().trim().isEmpty()) {
                        submission.setErrorMessage(msg.getCompileMessage());
                }

                submissionRepository.save(submission);

                // 3. Logic Penalty ACM-ICPC và Leaderboard Realtime
                // alreadyAC được kiểm tra TRƯỚC khi save() → tránh race condition
                if (submission.getContest() != null && !submission.getIsTestRun()) {
                        leaderboardService.updateScore(submission, alreadyAC);
                }

                // 4. Gửi Socket về ReactJS realtime
                // Nếu là chạy thử, gửi kèm kết quả từng test case (để hiển thị output thực tế)
                List<SubmissionResultDTO.TestCaseResultDTO> tcResultDTOs = null;
                if (Boolean.TRUE.equals(submission.getIsTestRun()) && msg.getTestCaseResults() != null) {
                        // Sắp xếp kết quả test theo thứ tự số
                        msg.getTestCaseResults().sort(java.util.Comparator
                                        .comparingInt(com.codegym.spring_boot.dto.TestCaseResult::getTestCaseNumber));

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
                                .status(finalStatus != null ? finalStatus.name()
                                                : com.codegym.spring_boot.entity.enums.SubmissionStatus.pending.name())
                                .executionTime(submission.getExecutionTime().longValue())
                                .memoryUsed(submission.getMemoryUsed().longValue())
                                .score(submission.getScore())
                                .isRunOnly(submission.getIsTestRun())
                                .testCaseResults(tcResultDTOs)
                                .build();
                notificationService.sendSubmissionUpdate(msg.getUserId(), dto);

                // --- Gửi Socket cho Live Monitor của Moderator ---
                if (submission.getContest() != null && !Boolean.TRUE.equals(submission.getIsTestRun())) {
                        // 3. Chuẩn bị payload thông báo qua Socket.IO cho luồng submissions của monitor
                        com.codegym.spring_boot.dto.moderator.response.MonitorDashboardResponse.MonitorSubmissionLog logEntry = com.codegym.spring_boot.dto.moderator.response.MonitorDashboardResponse.MonitorSubmissionLog
                                        .builder()
                                        .submissionId(submission.getId())
                                        .fullname(submission.getUser().getFullName() != null
                                                        ? submission.getUser().getFullName()
                                                        : submission.getUser().getUsername())
                                        .problemId(submission.getProblem().getId())
                                        .problemTitle(submission.getProblem().getTitle())
                                        .status(finalStatus != null ? finalStatus.name()
                                                        : com.codegym.spring_boot.entity.enums.SubmissionStatus.pending
                                                                        .name())
                                        .score(submission.getScore())
                                        .submittedAt(submission.getCreatedAt().toString())
                                        .build();
                        notificationService.sendToMonitor(submission.getContest().getId(), logEntry);

                        // Lấy top 5 cập nhật mới nhất để đẩy về Leaderboard Table
                        java.util.List<com.codegym.spring_boot.entity.ContestParticipant> topParticipants = contestParticipantRepository
                                        .findByIdContestIdOrderByTotalScoreDescTotalPenaltyAsc(
                                                        submission.getContest().getId())
                                        .stream().limit(5).collect(Collectors.toList());

                        java.util.List<com.codegym.spring_boot.dto.moderator.response.MonitorDashboardResponse.MonitorLeaderboardEntry> leaderboard = new java.util.ArrayList<>();
                        int rank = 1;
                        for (var p : topParticipants) {
                                String fullname = p.getUser().getFullName() != null ? p.getUser().getFullName()
                                                : p.getUser().getUsername();

                                double acRate = 0.0;
                                long totalUserSubs = submissionRepository.countByUserIdAndContestId(p.getUser().getId(),
                                                submission.getContest().getId());
                                if (totalUserSubs > 0) {
                                        long acUserSubs = submissionRepository.countByUserIdAndContestIdAndStatus(
                                                        p.getUser().getId(), submission.getContest().getId(),
                                                        SubmissionStatus.AC);
                                        acRate = (double) acUserSubs / totalUserSubs * 100.0;
                                }

                                leaderboard.add(com.codegym.spring_boot.dto.moderator.response.MonitorDashboardResponse.MonitorLeaderboardEntry
                                                .builder()
                                                .rank(rank++)
                                                .userId(p.getUser().getId().longValue())
                                                .username(p.getUser().getUsername())
                                                .fullname(fullname)
                                                .totalScore(p.getTotalScore())
                                                .totalPenalty(p.getTotalPenalty())
                                                .acRate(Math.round(acRate * 100.0) / 100.0)
                                                .build());
                        }
                        notificationService.sendLeaderboardUpdateToMonitor(submission.getContest().getId(),
                                        leaderboard);
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
                                .status(sub.getStatus() != null ? sub.getStatus().name()
                                                : com.codegym.spring_boot.entity.enums.SubmissionStatus.pending.name())
                                .executionTime(sub.getExecutionTime())
                                .memoryUsed(sub.getMemoryUsed())
                                .score(sub.getScore())
                                .createdAt(sub.getCreatedAt())
                                .sourceCode(sub.getSourceCode())
                                .languageName(sub.getLanguage() != null ? sub.getLanguage().getName() : null)
                                .build()).collect(Collectors.toList());
        }

        @Override
        @Transactional(readOnly = true)
        public SubmissionDetailDTO getSubmissionDetail(Integer submissionId) {
                Submission submission = submissionRepository.findById(submissionId)
                                .orElseThrow(() -> new jakarta.persistence.NoResultException(
                                                "Không tìm thấy bài nộp ID: " + submissionId));

                // Bảo mật: Kiểm tra xem bài nộp có thuộc về user hiện tại không
                Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                String username = auth.getName();
                if (!submission.getUser().getUsername().equals(username)) {
                        boolean isAdmin = auth.getAuthorities().stream()
                                        .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")
                                                        || a.getAuthority().equals("ROLE_MODERATOR"));
                        if (!isAdmin) {
                                throw new SecurityException("Bạn không có quyền xem bài nộp của người khác.");
                        }
                }

                // Lấy danh sách kết quả chi tiết từng testcase (Dùng JOIN FETCH để lấy luôn
                // TestCase tránh Lazy load issue)
                List<SubmissionTestResult> testResults = submissionTestResultRepository
                                .findBySubmissionId(submissionId);

                // Sắp xếp testResults theo số thứ tự trích xuất từ tên file input (VD: 1.in,
                // 2.in, 11.in)
                testResults.sort((t1, t2) -> {
                        try {
                                String name1 = (t1.getTestCase() != null && t1.getTestCase().getInputFilename() != null)
                                                ? t1.getTestCase().getInputFilename()
                                                : "";
                                String name2 = (t2.getTestCase() != null && t2.getTestCase().getInputFilename() != null)
                                                ? t2.getTestCase().getInputFilename()
                                                : "";
                                String num1 = name1.replaceAll("[^0-9]", "");
                                String num2 = name2.replaceAll("[^0-9]", "");
                                int n1 = num1.isEmpty() ? 0 : Integer.parseInt(num1);
                                int n2 = num2.isEmpty() ? 0 : Integer.parseInt(num2);
                                return Integer.compare(n1, n2);
                        } catch (Exception e) {
                                return 0;
                        }
                });

                // Tính maxScore của bài tập
                Integer problemId = submission.getProblem().getId();
                int maxScoreVal = testCaseRepository.sumScoreWeightByProblemId(problemId);
                log.info("[SubmissionDetail] ID: {}, ProblemID: {}, Computed maxScore: {}", submissionId, problemId,
                                maxScoreVal);

                List<TestCaseResultDetailDTO> detailTCs = testResults.stream()
                                .map(tr -> {
                                        TestCase tc = tr.getTestCase();
                                        Integer weight = 1; // Mặc định 1 để khớp với logic chấm
                                        if (tc != null) {
                                                weight = tc.getScoreWeight();
                                                if (weight == null)
                                                        weight = 1;
                                        }

                                        boolean isAC = tr.getStatus() == SubmissionStatus.AC;
                                        int tcScore = isAC ? weight : 0;

                                        log.info("[SubmissionDetail] ID: {}, TC_ID: {}, TR_ID: {}, Status: {}, Weight: {}, Score: {}, Time: {}ms, Mem: {}KB",
                                                        submissionId, (tc != null ? tc.getId() : "null"), tr.getId(),
                                                        tr.getStatus(), weight, tcScore, tr.getExecutionTime(),
                                                        tr.getMemoryUsed());

                                        return TestCaseResultDetailDTO.builder()
                                                        .id(tr.getId())
                                                        .status(tr.getStatus() != null ? tr.getStatus().name()
                                                                        : com.codegym.spring_boot.entity.enums.SubmissionStatus.RE
                                                                                        .name())
                                                        .executionTime(tr.getExecutionTime() != null
                                                                        ? tr.getExecutionTime()
                                                                        : 0)
                                                        .memoryUsed(tr.getMemoryUsed() != null ? tr.getMemoryUsed() : 0)
                                                        .isSample(tc != null && Boolean.TRUE.equals(tc.getIsSample()))
                                                        .input((tc != null && Boolean.TRUE.equals(tc.getIsSample()))
                                                                        ? tc.getSampleInput()
                                                                        : null)
                                                        .expectedOutput((tc != null
                                                                        && Boolean.TRUE.equals(tc.getIsSample()))
                                                                                        ? tc.getSampleOutput()
                                                                                        : null)
                                                        .actualOutput((tc != null
                                                                        && Boolean.TRUE.equals(tc.getIsSample()))
                                                                                        ? tr.getUserOutput()
                                                                                        : null)
                                                        .errorMessage(tr.getErrorMessage())
                                                        .score(tcScore)
                                                        .scoreWeight(weight)
                                                        .build();
                                })
                                .collect(Collectors.toList());

                return SubmissionDetailDTO.builder()
                                .id(submission.getId())
                                .status(submission.getStatus() != null ? submission.getStatus().name()
                                                : com.codegym.spring_boot.entity.enums.SubmissionStatus.pending.name())
                                .score(submission.getScore())
                                .maxScore(maxScoreVal)
                                .executionTime(submission.getExecutionTime())
                                .memoryUsed(submission.getMemoryUsed())
                                .sourceCode(submission.getSourceCode())
                                .createdAt(submission.getCreatedAt())
                                .isTestRun(submission.getIsTestRun())
                                .testCaseResults(detailTCs)
                                .build();
        }
}
