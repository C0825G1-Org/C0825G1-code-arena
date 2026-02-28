package com.codegym.spring_boot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionResultDTO {
    private Long submissionId;
    private Integer problemId;
    private Integer contestId;
    private String status;
    private Long executionTime;
    private Long memoryUsed;
    private Integer score;
    private Boolean isRunOnly;
}
