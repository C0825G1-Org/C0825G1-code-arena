package com.codegym.spring_boot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionHistoryDTO {
    private Integer id;
    private String status;
    private Integer executionTime;
    private Integer memoryUsed;
    private Integer score;
    private LocalDateTime createdAt;
    private String sourceCode; // Mã nguồn của lần nộp
    private String languageName; // Tên ngôn ngữ (cpp, java, python, javascript)
    private String username;
    private Integer globalRating;
    private Integer practiceRating;
}
