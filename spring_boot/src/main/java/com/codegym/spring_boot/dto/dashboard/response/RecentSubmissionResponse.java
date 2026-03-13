package com.codegym.spring_boot.dto.dashboard.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecentSubmissionResponse {
    private Integer id;
    private String problemTitle;
    private String problemSlug;
    private Integer problemId;
    private String status;
    private String language;
    private Long executionTime;
    private Double memoryUsage;
    private LocalDateTime createdAt;
}
