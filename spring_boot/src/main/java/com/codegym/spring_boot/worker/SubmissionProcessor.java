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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Tách processSubmission ra một @Service riêng để @Transactional hoạt động đúng.
 * Nếu để trong JudgeWorker, self-invocation sẽ bypass Spring proxy và @Transactional
 * sẽ không được áp dụng, gây ra LazyInitializationException.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SubmissionProcessor {

    private final DockerJudgeService dockerJudgeService;
    private final SubmissionRepository submissionRepository;
    private final ObjectMapper objectMapper;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String RESULT_CHANNEL = "judge_results";

    @Transactional
    public void process(JudgeTicket ticket) {
        // Lấy submission kèm tất cả các quan hệ cần thiết (EAGER via JOIN FETCH)
        Submission submission = submissionRepository.findByIdWithAssociations(ticket.submissionId())
                .orElseThrow(() -> new RuntimeException("Submission not found: " + ticket.submissionId()));

        log.info("Starting docker judge for submission {}, language: {}, problem: {}",
                submission.getId(),
                submission.getLanguage().getName(),
                submission.getProblem().getId());

        try {
            // 1. Gửi bài lên Docker để chấm
            SubmissionResult result = dockerJudgeService.judge(
                    submission.getLanguage().getName(),
                    submission.getSourceCode(),
                    submission.getProblem().getId().toString()
            );

            log.info("Docker judging done for submission {}. Status: {}", submission.getId(), result.getStatus());

            if (!result.getStatus().equals("ACCEPTED")) {
                log.warn("Submission {} not accepted. Docker logs:\n{}", submission.getId(), result.getMessage());
            }

            // 2. Cập nhật kết quả vào DB
            submission.setStatus(mapStatus(result.getStatus()));
            submission.setExecutionTime((int) result.getExecutionTimeMs());
            submission.setMemoryUsed((int) result.getMemoryUsedKb());
            submission.setScore("ACCEPTED".equals(result.getStatus()) ? 100 : 0);
            submission.setErrorMessage(result.getMessage());
            submissionRepository.save(submission);

            log.info("Submission {} saved to DB with status: {}", submission.getId(), submission.getStatus());

            // 3. Gửi thông báo qua Redis để Frontend nhận qua Socket.io
            try {
                JudgeResultMessage message = JudgeResultMessage.builder()
                        .userId(submission.getUser().getId().longValue())
                        .submissionId((long) submission.getId())
                        .status(submission.getStatus().name())
                        .executionTime((long) submission.getExecutionTime())
                        .memoryUsed((long) submission.getMemoryUsed())
                        .score(submission.getScore())
                        .build();
                redisTemplate.convertAndSend(RESULT_CHANNEL, objectMapper.writeValueAsString(message));
                log.info("Result message sent to Redis channel for submission {}", submission.getId());
            } catch (Exception e) {
                log.error("Failed to send result to Redis channel (non-critical)", e);
            }

        } catch (Exception e) {
            log.error("Critical error while judging submission {}", submission.getId(), e);
            submission.setStatus(SubmissionStatus.RE);
            submission.setErrorMessage("System Error: " + e.getMessage());
            submissionRepository.save(submission);
        }
    }

    private SubmissionStatus mapStatus(String dockerStatus) {
        return switch (dockerStatus) {
            case "ACCEPTED"             -> SubmissionStatus.AC;
            case "WRONG_ANSWER"         -> SubmissionStatus.WA;
            case "TIME_LIMIT_EXCEEDED"  -> SubmissionStatus.TLE;
            case "MEMORY_LIMIT_EXCEEDED"-> SubmissionStatus.MLE;
            case "RUNTIME_ERROR"        -> SubmissionStatus.RE;
            case "COMPILE_ERROR"        -> SubmissionStatus.CE;
            default                     -> SubmissionStatus.RE;
        };
    }
}
