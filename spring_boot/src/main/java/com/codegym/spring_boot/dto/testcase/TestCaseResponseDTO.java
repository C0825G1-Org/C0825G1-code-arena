package com.codegym.spring_boot.dto.testcase;

import lombok.Data;

@Data
public class TestCaseResponseDTO {
    private Integer id;
    private Boolean isSample;
    private String sampleInput;
    private String sampleOutput;
    private String inputFilename;
    private String outputFilename;
    private Integer scoreWeight;
}
