package com.codegym.spring_boot.entity;

import com.codegym.spring_boot.entity.enums.SubmissionStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "submissions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Submission extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "problem_id", nullable = false)
    private Problem problem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contest_id")
    private Contest contest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "language_id", nullable = false)
    private Language language;

    @NotBlank(message = "Mã nguồn không được để trống")
    @Lob
    @Column(name = "source_code", columnDefinition = "LONGTEXT", nullable = false)
    private String sourceCode;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    private SubmissionStatus status = SubmissionStatus.pending;

    @Builder.Default
    @Column(name = "execution_time")
    private Integer executionTime = 0;

    @Builder.Default
    @Column(name = "memory_used")
    private Integer memoryUsed = 0;

    @Builder.Default
    private Integer score = 0;

    @Builder.Default
    @Column(name = "is_test_run")
    private Boolean isTestRun = false;

    @Lob
    @Column(name = "error_message", columnDefinition = "LONGTEXT")
    private String errorMessage;
}
