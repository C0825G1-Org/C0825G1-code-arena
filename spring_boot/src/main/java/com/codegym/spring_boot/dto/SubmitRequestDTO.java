package com.codegym.spring_boot.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SubmitRequestDTO {
    @NotNull(message = "Problem ID is required")
    private Integer problemId;

    @NotNull(message = "Language ID is required")
    private Integer languageId;

    @NotBlank(message = "Source code is required")
    @Size(max = 50000, message = "Source code must be less than 50KB")
    private String sourceCode;

    // Optional: Only provided when submitting inside a contest
    private Integer contestId;

    private Boolean isRunOnly = false;
}
