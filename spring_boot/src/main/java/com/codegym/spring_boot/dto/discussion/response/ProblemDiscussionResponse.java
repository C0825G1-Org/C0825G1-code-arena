package com.codegym.spring_boot.dto.discussion.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class ProblemDiscussionResponse {
    private Integer id;
    private Integer problemId;
    private String problemTitle;
    private Integer userId;
    private String userFullName;
    private String userUsername;
    private String userAvatar;
    private Integer userGlobalRating;
    private Integer userPracticeRating;
    private String userAvatarFrame;
    private String content;
    private Boolean userIsDiscussionLocked;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
