package com.codegym.spring_boot.repository;

import com.codegym.spring_boot.entity.ShopPurchase;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ShopPurchaseRepository extends JpaRepository<ShopPurchase, Integer> {
    List<ShopPurchase> findByUserIdOrderByPurchasedAtDesc(Integer userId);
    boolean existsByUserIdAndItemId(Integer userId, Integer itemId);
}
