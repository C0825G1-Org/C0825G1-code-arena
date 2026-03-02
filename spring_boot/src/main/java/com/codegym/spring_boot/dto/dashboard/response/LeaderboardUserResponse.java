package com.codegym.spring_boot.dto.dashboard.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardUserResponse {
    private Integer rank;
    private Integer userId;
    private String username;
    private String fullName;
    private String email;
    private Integer globalRating;
    private Long solvedCount;
    private Double acRate;
}
