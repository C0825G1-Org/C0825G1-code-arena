package com.codegym.spring_boot.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "test_cases")
@Data
public class TestCase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "problem_id")
    private Problem problem;

    @Column(name = "is_sample")
    private Boolean isSample = false;

    @Column(name = "sample_input", columnDefinition = "TEXT")
    private String sampleInput;

    @Column(name = "sample_output", columnDefinition = "TEXT")
    private String sampleOutput;

    @Column(name = "input_filename")
    private String inputFilename;

    @Column(name = "output_filename")
    private String outputFilename;

    @Column(name = "score_weight")
    private Integer scoreWeight = 1;
}
