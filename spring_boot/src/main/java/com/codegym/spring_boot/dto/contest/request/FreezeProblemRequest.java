package com.codegym.spring_boot.dto.contest.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FreezeProblemRequest {
    @NotBlank(message = "Lý do đóng băng không được để trống")
    private String reason;
}
