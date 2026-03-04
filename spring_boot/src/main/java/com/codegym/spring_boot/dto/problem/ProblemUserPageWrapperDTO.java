package com.codegym.spring_boot.dto.problem;

import org.springframework.data.domain.Page;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProblemUserPageWrapperDTO {
    private Page<ProblemUserDTO> problems;
    private long totalProblems;
    private long solvedProblems;
}
