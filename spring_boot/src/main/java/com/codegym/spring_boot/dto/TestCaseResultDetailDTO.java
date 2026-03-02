package com.codegym.spring_boot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestCaseResultDetailDTO {
    private Integer id;
    private String status;
    private Integer executionTime;
    private Integer memoryUsed;
    private boolean isSample;
    private String input;
    private String expectedOutput;
    private String actualOutput;
    private String errorMessage;
}
