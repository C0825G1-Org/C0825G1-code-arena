package com.codegym.spring_boot.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActiveContestDTO {
    private Integer id;
    private String title;
    private String status;          // "active" | "upcoming"
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private long participants;
    private long problems;
}
