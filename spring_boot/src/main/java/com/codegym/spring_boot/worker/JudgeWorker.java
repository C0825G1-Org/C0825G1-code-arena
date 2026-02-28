package com.codegym.spring_boot.worker;

import com.codegym.spring_boot.dto.JudgeTicket;
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
    private final ObjectMapper objectMapper;
    private final SubmissionProcessor submissionProcessor;  // Dùng bean riêng để @Transactional hoạt động

    private static final String QUEUE_NAME = "judge_queue";

    @Scheduled(fixedDelay = 1000) // Kiểm tra hàng đợi mỗi giây
    public void consumeQueue() {
        Object ticketObj = redisTemplate.opsForList().rightPop(QUEUE_NAME);
        if (ticketObj == null) return;

        try {
            JudgeTicket ticket = objectMapper.convertValue(ticketObj, JudgeTicket.class);
            log.info(">>> Dequeued ticket for submission ID: {}", ticket.submissionId());

            // Gọi sang bean khác để @Transactional hoạt động đúng (tránh self-invocation)
            submissionProcessor.process(ticket);

        } catch (Exception e) {
            log.error("Error processing judge ticket from queue", e);
        }
    }
}
