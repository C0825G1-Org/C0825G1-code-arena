package com.codegym.spring_boot.dto.dashboard.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopCoderResponse {
    private Integer userId;
    private String username;
    private String fullName;
    private Integer globalRating;
    private String avatarUrl;
    private String avatarFrame;
}
