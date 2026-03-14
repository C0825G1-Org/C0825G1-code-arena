package com.codegym.spring_boot.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "shop_purchases")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopPurchase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "item_id", nullable = false)
    private ShopItem item;

    @Builder.Default
    @Column(nullable = false)
    private Integer quantity = 1;

    @Column(name = "total_cost", nullable = false)
    private Integer totalCost;

    @Column(name = "purchased_at")
    private LocalDateTime purchasedAt;

    @PrePersist
    public void prePersist() {
        purchasedAt = LocalDateTime.now();
    }
}
