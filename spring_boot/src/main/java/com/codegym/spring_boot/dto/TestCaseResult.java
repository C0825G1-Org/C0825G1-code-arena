package com.codegym.spring_boot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestCaseResult {
    private int testCaseNumber;
    private boolean passed;
    private String message;
    private Long executionTime;
    private Long memoryUsed;
    private String userOutput;
}