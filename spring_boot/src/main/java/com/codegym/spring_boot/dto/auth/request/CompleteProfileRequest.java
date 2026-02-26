package com.codegym.spring_boot.dto.auth.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CompleteProfileRequest {
    @NotBlank(message = "Registration token is required")
    private String regToken;

    @NotBlank(message = "Full name is required")
    private String fullName;
}
