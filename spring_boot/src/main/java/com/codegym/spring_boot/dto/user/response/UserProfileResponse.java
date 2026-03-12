package com.codegym.spring_boot.dto.user.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private Integer id;
    private String username;
    private String fullName;
    private String email;
    private Integer globalRating;
    private String avatarUrl;
    private String bio;
    private String githubLink;
    private java.time.LocalDateTime createdAt;
}
