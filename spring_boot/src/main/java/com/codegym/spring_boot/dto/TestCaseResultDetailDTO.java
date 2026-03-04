package com.codegym.spring_boot.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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
    // Fix: dùng Boolean (wrapper) + @JsonProperty để Jackson serialize đúng key
    // "isSample"
    // Nếu dùng boolean primitive, Lombok tạo getter isSample() → Jackson bỏ prefix
    // "is" → key "sample"
    @JsonProperty("isSample")
    private Boolean isSample;
    private String input;
    private String expectedOutput;
    private String actualOutput;
    private String errorMessage;
}
