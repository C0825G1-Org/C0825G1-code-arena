package com.codegym.spring_boot.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "contest_participants")
@Data
public class ContestParticipant extends BaseEntity {
    @EmbeddedId
    private ContestParticipantId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("contestId")
    @JoinColumn(name = "contest_id")
    private Contest contest;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "total_score")
    private Integer totalScore = 0;

    @Column(name = "total_penalty")
    private Integer totalPenalty = 0;
}
