package com.codegym.spring_boot.service;

import com.codegym.spring_boot.entity.ShopItem;
import com.codegym.spring_boot.entity.ShopPurchase;

import java.util.List;

public interface IShopService {
    List<ShopItem> getItems();
    int getBalance(Integer userId);
    ShopPurchase purchase(Integer userId, Integer itemId, Integer quantity);
    List<ShopPurchase> getPurchaseHistory(Integer userId);
    void addToBalance(Integer userId, int amount);
    ShopItem createItem(String name, String description, Integer price, String category, Integer stock, org.springframework.web.multipart.MultipartFile image) throws java.io.IOException;
    List<ShopItem> getAdminItems();
    ShopItem updateItem(Integer itemId, String name, String description, Integer price, String category, Integer stock, Boolean isActive, org.springframework.web.multipart.MultipartFile image) throws java.io.IOException;
    void deleteItem(Integer itemId);
}
