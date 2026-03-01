package com.codegym.spring_boot.worker;

import com.codegym.spring_boot.dto.JudgeResultMessage;
import com.codegym.spring_boot.service.ISubmissionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class JudgeResultListener {

    private final ISubmissionService submissionService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public void handleMessage(String message) {
        try {
            log.info("Received judge result from Redis: {}", message);
            JudgeResultMessage msg = objectMapper.readValue(message, JudgeResultMessage.class);

            // Xử lý lưu DB, so khớp và gửi notification từ bên trong Service
            submissionService.processJudgeResult(msg);

        } catch (Exception e) {
            log.error("Failed to process judge result message from Redis", e);
        }
    }
}
