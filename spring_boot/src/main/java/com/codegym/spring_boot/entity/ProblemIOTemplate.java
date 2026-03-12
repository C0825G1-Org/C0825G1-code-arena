package com.codegym.spring_boot.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "problem_io_templates")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "problem")
@EqualsAndHashCode(exclude = "problem")
public class ProblemIOTemplate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "problem_id", nullable = false)
    private Problem problem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "language_id", nullable = false)
    private Language language;

    @Lob
    @Column(name = "template_code", columnDefinition = "LONGTEXT", nullable = false)
    private String templateCode;
}
