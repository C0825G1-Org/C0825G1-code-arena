package com.codegym.spring_boot.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Entity
@Table(name = "contest_clarifications")
@Data
@EqualsAndHashCode(callSuper = false)
public class ContestClarification extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contest_id", nullable = false)
    private Contest contest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "problem_id")
    private Problem problem; // nullable — có thể hỏi chung về contest

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user; // Thí sinh gửi câu hỏi

    @Column(nullable = false, columnDefinition = "TEXT")
    private String question;

    @Column(columnDefinition = "TEXT")
    private String answer; // null = chưa trả lời

    @Column(name = "is_public")
    private Boolean isPublic = false; // true = broadcast cho tất cả

    @Column(name = "answered_at")
    private LocalDateTime answeredAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "answered_by")
    private User answeredBy; // Moderator trả lời
}
