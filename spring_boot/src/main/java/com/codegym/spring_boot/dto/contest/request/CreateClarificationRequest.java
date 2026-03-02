package com.codegym.spring_boot.dto.contest.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateClarificationRequest {
    private Integer problemId; // nullable — câu hỏi chung nếu null

    @NotBlank(message = "Nội dung câu hỏi không được để trống")
    private String question;
}
