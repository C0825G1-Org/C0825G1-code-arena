package com.codegym.spring_boot.dto.contest.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ExtendContestRequest {
    @NotNull(message = "Số phút cần thêm không được để trống")
    @Min(value = 1, message = "Số phút cần thêm phải lớn hơn 0")
    private Integer minutesToAdd;
}
