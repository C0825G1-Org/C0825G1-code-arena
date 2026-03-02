package com.codegym.spring_boot.dto.contest.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClarificationResponse {
    private Integer id;
    private Integer contestId;
    private Integer problemId;
    private String problemTitle;
    private String askedBy;
    private String question;
    private String answer;
    private boolean isPublic;
    private LocalDateTime createdAt;
    private LocalDateTime answeredAt;
    private String answeredBy;
}
