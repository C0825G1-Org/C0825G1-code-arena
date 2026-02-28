package com.codegym.spring_boot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionDetailDTO {
    private Integer id;
    private String status;
    private Integer score;
    private Integer executionTime;
    private Integer memoryUsed;
    private String sourceCode;
    private LocalDateTime createdAt;
    private Boolean isTestRun;
    private List<TestCaseResultDetailDTO> testCaseResults;
}
