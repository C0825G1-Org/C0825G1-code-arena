package com.codegym.spring_boot.dto.discussion.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateDiscussionRequest {
    @NotBlank(message = "Nội dung bình luận không được để trống")
    private String content;
}
