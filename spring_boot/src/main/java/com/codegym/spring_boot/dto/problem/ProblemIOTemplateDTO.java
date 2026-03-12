package com.codegym.spring_boot.dto.problem;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProblemIOTemplateDTO {
    private Integer languageId;
    private String languageName;
    private String templateCode;
}
