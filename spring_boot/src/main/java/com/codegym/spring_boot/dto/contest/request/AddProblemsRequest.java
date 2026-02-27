package com.codegym.spring_boot.dto.contest.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class AddProblemsRequest {
    @NotEmpty(message = "Danh sách bài tập không được rỗng")
    @Valid
    private List<ProblemEntry> problems;

    @Data
    public static class ProblemEntry {
        @NotNull(message = "ID bài tập không được để trống")
        private Integer problemId;

        @NotNull(message = "Thứ tự bài tập không được để trống")
        private Integer orderIndex;
    }
}
