package com.codegym.spring_boot.dto.problem;

import com.codegym.spring_boot.entity.enums.Difficulty;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.Set;

@Data
public class ProblemRequestDTO {
    @NotBlank(message = "Tiêu đề không được để trống")
    private String title;

    @NotBlank(message = "Slug không được để trống")
    private String slug;

    @NotBlank(message = "Mô tả không được để trống")
    private String description;
    private Difficulty difficulty;

    @Min(value = 100, message = "Thời gian giới hạn tối thiểu 100ms")
    @Max(value = 5000, message = "Thời gian giới hạn tối đa 5s")
    private Integer timeLimit;

    @Min(value = 16, message = "Bộ nhớ tối thiểu 16MB")
    @Max(value = 1024, message = "Bộ nhớ tối đa 1024MB")
    private Integer memoryLimit;

    private Set<Integer> tagIds;
    private Set<ProblemIOTemplateDTO> ioTemplates;
}
