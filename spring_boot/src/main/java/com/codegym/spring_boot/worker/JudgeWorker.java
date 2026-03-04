package com.codegym.spring_boot.worker;

import com.codegym.spring_boot.dto.JudgeResultMessage;
import com.codegym.spring_boot.dto.JudgeTicket;
import com.codegym.spring_boot.dto.SubmissionResult;
import com.codegym.spring_boot.entity.Submission;
import com.codegym.spring_boot.repository.SubmissionRepository;
import com.codegym.spring_boot.service.DockerJudgeService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class JudgeWorker {

    private final RedisTemplate<String, Object> redisTemplate;
    private final DockerJudgeService dockerJudgeService;
    private final SubmissionRepository submissionRepository;
    private final com.codegym.spring_boot.repository.ITestCaseRepository testCaseRepository;
    private final ObjectMapper objectMapper;

    private static final String QUEUE_NAME = "judge_queue";
    private static final String RESULT_CHANNEL = "judge_results";

    @Scheduled(fixedDelay = 1000)
    public void consumeQueue() {
        log.trace(">>> [WORKER] Heartbeat: Checking queue {}", QUEUE_NAME);
        try {
            Object ticketObj = redisTemplate.opsForList().rightPop(QUEUE_NAME);
            if (ticketObj == null)
                return;

            log.info(">>> [WORKER] Found item in queue: {}", ticketObj);
            JudgeTicket ticket = objectMapper.convertValue(ticketObj, JudgeTicket.class);
            log.info(">>> [WORKER] Dequeued ticket for submission ID: {}. Queue: {}", ticket.submissionId(),
                    QUEUE_NAME);

            processSubmission(ticket);

        } catch (Exception e) {
            log.error("!!! [WORKER] Error in consumeQueue loop", e);
        }
    }

    public void processSubmission(JudgeTicket ticket) {
        try {
            // 1. Lấy thông tin submission từ Repository với JOIN FETCH
            Submission submission = submissionRepository.findByIdWithAssociations(ticket.submissionId())
                    .orElseThrow(() -> new RuntimeException("Submission not found: " + ticket.submissionId()));

            log.info(">>> [WORKER] Processing submission {}, language: {}, problem: {}",
                    submission.getId(),
                    submission.getLanguage().getName(),
                    submission.getProblem().getId());

            // 1b. Thông báo cho UI rằng đang chấm bài (JUDGING)
            JudgeResultMessage judgingMsg = JudgeResultMessage.builder()
                    .userId(submission.getUser().getId().longValue())
                    .submissionId((long) submission.getId())
                    .status("judging")
                    .build();
            redisTemplate.convertAndSend(RESULT_CHANNEL, judgingMsg);

            // 2. Thực hiện chấm bài qua Docker (Có thể mất thời gian)
            long start = System.currentTimeMillis();
            // Lấy danh sách sample testcases nếu là chạy thử
            java.util.List<String> sampleFilenames = null;
            if (Boolean.TRUE.equals(ticket.isRunOnly())) {
                sampleFilenames = testCaseRepository.findByProblemId(submission.getProblem().getId())
                        .stream()
                        .filter(tc -> Boolean.TRUE.equals(tc.getIsSample()))
                        .map(com.codegym.spring_boot.entity.TestCase::getInputFilename)
                        .toList();
            }

            SubmissionResult result = dockerJudgeService.judge(
                    submission.getLanguage().getName(),
                    submission.getSourceCode(),
                    submission.getProblem().getId().toString(),
                    ticket.isRunOnly(),
                    sampleFilenames);

            log.info(">>> [WORKER] Docker judge finished in {}ms for submission {}. Result: {}",
                    (System.currentTimeMillis() - start), submission.getId(), result.getStatus());

            // 3. Gửi thông báo qua Redis Channel để JudgeResultListener xử lý lưu DB và
            // Socket.io đẩy về React
            JudgeResultMessage message = JudgeResultMessage.builder()
                    .userId(submission.getUser().getId().longValue())
                    .submissionId((long) submission.getId())
                    .status(result.getStatus())
                    .executionTime(result.getExecutionTimeMs())
                    .memoryUsed(result.getMemoryUsedKb())
                    .compileMessage(result.getMessage())
                    .testCaseResults(result.getTestCases())
                    .build();

            redisTemplate.convertAndSend(RESULT_CHANNEL, message);
            log.info("Finished docker judge and sent full result to Redis for submission {}", ticket.submissionId());

        } catch (Exception e) {
            log.error("Critical error in JudgeWorker for submission {}", ticket.submissionId(), e);
            JudgeResultMessage errorMessage = JudgeResultMessage.builder()
                    .submissionId(ticket.submissionId().longValue())
                    .status("RUNTIME_ERROR")
                    .compileMessage("Lỗi hệ thống khi chấm bài: " + e.getMessage())
                    .build();
            redisTemplate.convertAndSend(RESULT_CHANNEL, errorMessage);
        }
    }

}
