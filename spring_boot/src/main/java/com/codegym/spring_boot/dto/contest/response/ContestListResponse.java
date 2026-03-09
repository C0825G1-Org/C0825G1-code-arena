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
public class ContestListResponse {
    private Integer id;
    private String title;
    private String status;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private long participantCount;
    @Builder.Default
    private final int maxParticipants = 10;
    private LocalDateTime serverTime;
    @com.fasterxml.jackson.annotation.JsonProperty("isRegistered")
    private boolean isRegistered;
    private Integer firstProblemId;
    private String creatorName;
    private String creatorUsername;
}
