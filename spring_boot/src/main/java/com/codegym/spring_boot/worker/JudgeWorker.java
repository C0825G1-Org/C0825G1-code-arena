package com.codegym.spring_boot.worker;

import com.codegym.spring_boot.dto.JudgeResultMessage;
import com.codegym.spring_boot.dto.JudgeTicket;
import com.codegym.spring_boot.dto.SubmissionResult;
import com.codegym.spring_boot.entity.Submission;
import com.codegym.spring_boot.entity.enums.SubmissionStatus;
import com.codegym.spring_boot.repository.SubmissionRepository;
import com.codegym.spring_boot.service.DockerJudgeService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class JudgeWorker {

    private final RedisTemplate<String, Object> redisTemplate;
    private final DockerJudgeService dockerJudgeService;
    private final SubmissionRepository submissionRepository;
    private final ObjectMapper objectMapper;

    private static final String QUEUE_NAME = "judge_queue";
    private static final String RESULT_CHANNEL = "judge_results";

    @Scheduled(fixedDelay = 1000) // Kiểm tra hàng đợi mỗi giây
    public void consumeQueue() {
        Object ticketObj = redisTemplate.opsForList().rightPop(QUEUE_NAME);
        if (ticketObj == null)
            return;

        try {
            JudgeTicket ticket = objectMapper.convertValue(ticketObj, JudgeTicket.class);
            log.info("Processing ticket for submission ID: {}", ticket.submissionId());

            processSubmission(ticket);

        } catch (Exception e) {
            log.error("Error processing judge ticket", e);
        }
    }

    @Transactional
    public void processSubmission(JudgeTicket ticket) {
        Submission submission = submissionRepository.findById(ticket.submissionId())
                .orElseThrow(() -> new RuntimeException("Submission not found: " + ticket.submissionId()));

        try {
            // 1. Thực hiện chấm bài qua Docker
            SubmissionResult result = dockerJudgeService.judge(
                    submission.getLanguage().getName(),
                    submission.getSourceCode(),
                    submission.getProblem().getId().toString(),
                    ticket.isRunOnly());

            // 2. Gửi thông báo qua Redis Channel để Client nhận qua Socket.io và Server xử
            // lý lưu DB
            JudgeResultMessage message = JudgeResultMessage.builder()
                    .userId(submission.getUser().getId().longValue())
                    .submissionId((long) submission.getId())
                    .status(result.getStatus())
                    .executionTime(result.getExecutionTimeMs())
                    .memoryUsed(result.getMemoryUsedKb())
                    .compileMessage(result.getMessage())
                    .testCaseResults(result.getTestCases())
                    .build();

            redisTemplate.convertAndSend(RESULT_CHANNEL, objectMapper.writeValueAsString(message));
            log.info("Finished docker judge and sent full result to Redis for submission {}", ticket.submissionId());

        } catch (Exception e) {
            log.error("Critical error in JudgeWorker for submission {}", ticket.submissionId(), e);
            JudgeResultMessage errorMessage = JudgeResultMessage.builder()
                    .userId(submission.getUser().getId().longValue())
                    .submissionId((long) submission.getId())
                    .status("RUNTIME_ERROR")
                    .compileMessage(e.getMessage())
                    .build();
            try {
                redisTemplate.convertAndSend(RESULT_CHANNEL, objectMapper.writeValueAsString(errorMessage));
            } catch (Exception ex) {
            }
        }
    }

    private SubmissionStatus mapStatus(String dockerStatus) {
        return switch (dockerStatus) {
            case "ACCEPTED" -> SubmissionStatus.AC;
            case "WRONG_ANSWER" -> SubmissionStatus.WA;
            case "TIME_LIMIT_EXCEEDED" -> SubmissionStatus.TLE;
            case "MEMORY_LIMIT_EXCEEDED" -> SubmissionStatus.MLE;
            case "RUNTIME_ERROR" -> SubmissionStatus.RE;
            case "COMPILE_ERROR" -> SubmissionStatus.CE;
            default -> SubmissionStatus.RE;
        };
    }
}
