package com.codegym.spring_boot.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "shop_items")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopItem extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Integer price; // Cost in Total ELO points

    @Column(name = "image_url")
    private String imageUrl;

    private String category;

    @Column(nullable = false)
    private Integer stock = -1; // -1 = unlimited

    @Column(name = "is_active")
    private Boolean isActive = true;
}
