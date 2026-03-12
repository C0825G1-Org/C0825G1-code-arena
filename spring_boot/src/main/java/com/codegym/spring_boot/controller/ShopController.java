package com.codegym.spring_boot.controller;

import com.codegym.spring_boot.entity.User;
import com.codegym.spring_boot.entity.ShopItem;
import com.codegym.spring_boot.entity.ShopPurchase;
import com.codegym.spring_boot.service.IShopService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/shop")
@RequiredArgsConstructor
public class ShopController {

    private final IShopService shopService;

    @GetMapping("/items")
    public ResponseEntity<List<ShopItem>> getItems() {
        return ResponseEntity.ok(shopService.getItems());
    }

    @GetMapping("/balance")
    public ResponseEntity<Map<String, Integer>> getBalance(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }
        User user = (User) authentication.getPrincipal();
        Integer userId = user.getId();
        int balance = shopService.getBalance(userId);
        Map<String, Integer> response = new HashMap<>();
        response.put("shopBalance", balance);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/purchase/{itemId}")
    public ResponseEntity<?> purchaseItem(@PathVariable Integer itemId,
                                          @RequestParam(defaultValue = "1") Integer quantity,
                                          Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body("Yêu cầu đăng nhập.");
        }
        User user = (User) authentication.getPrincipal();
        Integer userId = user.getId();
        try {
            ShopPurchase purchase = shopService.purchase(userId, itemId, quantity);
            return ResponseEntity.ok(purchase);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Item không hợp lệ."));
        }
    }

    @GetMapping("/history")
    public ResponseEntity<List<ShopPurchase>> getPurchaseHistory(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }
        User user = (User) authentication.getPrincipal();
        Integer userId = user.getId();
        return ResponseEntity.ok(shopService.getPurchaseHistory(userId));
    }
}
