package com.codegym.spring_boot.dto.contest.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import jakarta.validation.constraints.NotEmpty;

@Data
public class CreateContestRequest {
    @NotBlank(message = "Tên cuộc thi không được để trống")
    private String title;

    private String description;

    @NotNull(message = "Thời gian bắt đầu không được để trống")
    @Future(message = "Thời gian bắt đầu phải ở tương lai")
    private LocalDateTime startTime;

    @NotNull(message = "Thời gian kết thúc không được để trống")
    @Future(message = "Thời gian kết thúc phải ở tương lai")
    private LocalDateTime endTime;

    @NotEmpty(message = "Cuộc thi phải có ít nhất 1 bài tập")
    private List<Integer> problemIds;

    private Integer maxParticipants = 10;
}
