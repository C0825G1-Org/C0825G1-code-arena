package com.codegym.spring_boot.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "contest_problems")
@Data
public class ContestProblem {
    @EmbeddedId
    private ContestProblemId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("contestId")
    @JoinColumn(name = "contest_id")
    private Contest contest;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("problemId")
    @JoinColumn(name = "problem_id")
    private Problem problem;

    @Column(name = "order_index")
    private Integer orderIndex = 0;

    @Column(name = "is_frozen")
    private Boolean isFrozen = false;

    @Column(name = "frozen_reason", length = 500)
    private String frozenReason;
}
