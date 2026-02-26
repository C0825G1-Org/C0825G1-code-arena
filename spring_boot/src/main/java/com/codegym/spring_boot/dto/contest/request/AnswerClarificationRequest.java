package com.codegym.spring_boot.dto.contest.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AnswerClarificationRequest {
    @NotBlank(message = "Nội dung trả lời không được để trống")
    private String answer;

    @NotNull(message = "Phải chỉ định câu trả lời là public hay private")
    private Boolean isPublic;
}
