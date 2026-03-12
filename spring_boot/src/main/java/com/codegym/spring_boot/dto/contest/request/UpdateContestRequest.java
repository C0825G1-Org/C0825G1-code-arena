package com.codegym.spring_boot.dto.contest.request;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UpdateContestRequest {
    private String title;
    private String description;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer maxParticipants;
}
