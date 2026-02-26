package com.codegym.spring_boot.service;

import com.codegym.spring_boot.dto.JudgeTicket;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class JudgeQueueService {

    private final RedisTemplate<String, Object> redisTemplate;
    private static final String QUEUE_NAME = "judge_queue";

    public void pushTicketToQueue(JudgeTicket ticket) {
        try {
            Long size = redisTemplate.opsForList().leftPush(QUEUE_NAME, ticket);
            log.info("Successfully pushed ticket to Redis queue: {}. Current queue size: {}", QUEUE_NAME, size);
        } catch (Exception e) {
            log.error("Failed to push ticket to Redis queue", e);
            throw new RuntimeException("Lỗi hệ thống khi đẩy bài tập vào hàng đợi chấm điểm", e);
        }
    }
}
