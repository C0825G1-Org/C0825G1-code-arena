package com.codegym.spring_boot.dto.testcase;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TestCaseRequestDTO {
    @NotBlank(message = "Input không được để trống")
    private String inputContent;

    @NotBlank(message = "Output không được để trống")
    private String outputContent;

    private Boolean isSample = false;
    
    // Trọng số điểm của test case (mặc định là 1)
    private Integer scoreWeight = 1;
}
