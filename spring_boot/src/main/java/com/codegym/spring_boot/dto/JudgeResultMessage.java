package com.codegym.spring_boot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JudgeResultMessage {
    private Long userId;
    private Long submissionId;
    private String status;
    private Long executionTime;
    private Long memoryUsed;
    private Integer score;
}
