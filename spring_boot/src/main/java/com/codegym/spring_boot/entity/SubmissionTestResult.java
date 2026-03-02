package com.codegym.spring_boot.entity;

import com.codegym.spring_boot.entity.enums.SubmissionStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "submission_test_results")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionTestResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id", nullable = false)
    private Submission submission;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_case_id", nullable = false)
    private TestCase testCase;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubmissionStatus status;

    @Builder.Default
    @Column(name = "execution_time")
    private Integer executionTime = 0;

    @Builder.Default
    @Column(name = "memory_used")
    private Integer memoryUsed = 0;

    @Column(name = "user_output", columnDefinition = "TEXT")
    private String userOutput;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage; // Lưu log lỗi compiler hoặc runtime
}
