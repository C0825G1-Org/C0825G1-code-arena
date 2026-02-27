package com.codegym.spring_boot.dto.problem;

import com.codegym.spring_boot.dto.tag.TagDTO;
import com.codegym.spring_boot.entity.enums.Difficulty;
import com.codegym.spring_boot.entity.enums.TestCaseStatus;
import lombok.*;

import java.util.Set;

@Data
public class ProblemResponseDTO {
    private Integer id;
    private String title;
    private String slug;
    private String description;
    private Difficulty difficulty;
    private Integer timeLimit;
    private Integer memoryLimit;
    private TestCaseStatus testcaseStatus;
    private Set<TagDTO> tags;
}
