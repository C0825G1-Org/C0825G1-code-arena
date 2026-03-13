package com.codegym.spring_boot.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "subscription_plan")
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionPlan extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal price = BigDecimal.ZERO;

    @Column(name = "max_contests_per_month", nullable = false)
    @Builder.Default
    private Integer maxContestsPerMonth = 2;

    @Column(name = "max_participants_per_contest", nullable = false)
    @Builder.Default
    private Integer maxParticipantsPerContest = 10;

    @Column(name = "snapshot_retention_days", nullable = false)
    @Builder.Default
    private Integer snapshotRetentionDays = 2;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
}
