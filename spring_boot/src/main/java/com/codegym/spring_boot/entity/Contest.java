package com.codegym.spring_boot.entity;

import com.codegym.spring_boot.entity.enums.ContestStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "contests")
@Data
public class Contest extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotBlank(message = "Tên cuộc thi không được để trống")
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @NotNull(message = "Thời gian bắt đầu không được để trống")
    @Future(message = "Thời gian bắt đầu phải ở tương lai")
    @Column(name = "start_time")
    private LocalDateTime startTime;

    @NotNull(message = "Thời gian kết thúc không được để trống")
    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Enumerated(EnumType.STRING)
    private ContestStatus status = ContestStatus.upcoming;
}
