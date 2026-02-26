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
    private LocalDateTime serverTime;
}
