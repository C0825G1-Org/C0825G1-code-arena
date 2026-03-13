package com.codegym.spring_boot.repository;

import com.codegym.spring_boot.entity.ShopItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ShopItemRepository extends JpaRepository<ShopItem, Integer> {
    List<ShopItem> findByIsActiveTrueAndIsDeletedFalse();
    List<ShopItem> findByIsDeletedFalse();
}
