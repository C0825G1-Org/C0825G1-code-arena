package com.codegym.spring_boot.dto.user.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {
    @NotBlank(message = "Tên hiển thị không được để trống")
    private String fullName;

    // Bio có thể rỗng
    private String bio;

    // Github link có thể rỗng
    private String githubLink;
}
