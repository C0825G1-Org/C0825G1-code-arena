package com.codegym.spring_boot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

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
    private String errorMessage;
    private Boolean isRunOnly;
    private List<TestCaseResultDTO> testCaseResults;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TestCaseResultDTO {
        private Integer id;
        private String status;
        private Boolean isSample;
        private String input;
        private String actualOutput;
        private String expectedOutput;
        private Long executionTime;
    }
}
