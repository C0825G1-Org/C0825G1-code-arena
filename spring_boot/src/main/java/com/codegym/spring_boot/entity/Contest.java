package com.codegym.spring_boot.entity;

import com.codegym.spring_boot.entity.enums.ContestStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Entity
@Table(name = "contests")
@Data
@EqualsAndHashCode(callSuper = false)
public class Contest extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotBlank(message = "Tên cuộc thi không được để trống")
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @NotNull(message = "Thời gian bắt đầu không được để trống")
    @Column(name = "start_time")
    private LocalDateTime startTime;

    @NotNull(message = "Thời gian kết thúc không được để trống")
    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Enumerated(EnumType.STRING)
    private ContestStatus status = ContestStatus.upcoming;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "is_frozen")
    private Boolean isFrozen = false;

    @Column(name = "frozen_reason", length = 500)
    private String frozenReason;
}
