package com.codegym.spring_boot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionHistoryDTO {
    private Integer id;
    private String status;
    private Integer executionTime;
    private Integer memoryUsed;
    private Integer score;
    private LocalDateTime createdAt;
}
