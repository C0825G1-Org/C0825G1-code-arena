package com.codegym.spring_boot.dto.problem;

import com.codegym.spring_boot.dto.tag.TagDTO;
import com.codegym.spring_boot.entity.enums.Difficulty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProblemUserDTO {
    private Integer id;
    private String title;
    private String slug;
    private Difficulty difficulty;
    private Set<TagDTO> tags;
    private String userStatus; // SOLVED, ATTEMPTED, UNATTEMPTED
}
