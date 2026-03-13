package com.codegym.spring_boot.service.impl;

import com.codegym.spring_boot.entity.ShopItem;
import com.codegym.spring_boot.entity.ShopPurchase;
import com.codegym.spring_boot.entity.User;
import com.codegym.spring_boot.repository.ShopItemRepository;
import com.codegym.spring_boot.repository.ShopPurchaseRepository;
import com.codegym.spring_boot.repository.UserRepository;
import com.codegym.spring_boot.service.CloudinaryService;
import com.codegym.spring_boot.service.IShopService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ShopService implements IShopService {

    private final ShopItemRepository shopItemRepository;
    private final ShopPurchaseRepository shopPurchaseRepository;
    private final UserRepository userRepository;
    private final CloudinaryService cloudinaryService;

    @Override
    public List<ShopItem> getItems() {
        return shopItemRepository.findByIsActiveTrueAndIsDeletedFalse();
    }

    @Override
    public int getBalance(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        return user.getShopBalance() != null ? user.getShopBalance() : 0;
    }

    @Override
    @Transactional
    public ShopPurchase purchase(Integer userId, Integer itemId, Integer quantity) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        ShopItem item = shopItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Item not found: " + itemId));

        if (!Boolean.TRUE.equals(item.getIsActive())) {
            throw new IllegalStateException("Vật phẩm không còn được bán.");
        }
        if (item.getStock() != -1 && item.getStock() < quantity) {
            throw new IllegalStateException("Không đủ hàng trong kho.");
        }

        int totalCost = item.getPrice() * quantity;
        int currentBalance = user.getShopBalance() != null ? user.getShopBalance() : 0;

        if (currentBalance < totalCost) {
            throw new IllegalStateException("Không đủ điểm ELO. Số dư: " + currentBalance + ", Cần: " + totalCost);
        }

        // Trừ shopBalance — ELO thực (globalRating, practiceRating) không bị ảnh hưởng
        user.setShopBalance(currentBalance - totalCost);
        userRepository.save(user);

        // Giảm stock nếu có giới hạn
        if (item.getStock() != -1) {
            item.setStock(item.getStock() - quantity);
            shopItemRepository.save(item);
        }

        ShopPurchase purchase = ShopPurchase.builder()
                .user(user)
                .item(item)
                .quantity(quantity)
                .totalCost(totalCost)
                .build();

        ShopPurchase saved = shopPurchaseRepository.save(purchase);
        log.info("User {} purchased {} x '{}' for {} ELO. New balance: {}",
                userId, quantity, item.getName(), totalCost, user.getShopBalance());
        return saved;
    }

    @Override
    public List<ShopPurchase> getPurchaseHistory(Integer userId) {
        return shopPurchaseRepository.findByUserIdOrderByPurchasedAtDesc(userId);
    }

    @Override
    @Transactional
    public void addToBalance(Integer userId, int amount) {
        if (amount <= 0) return;
        userRepository.findById(userId).ifPresent(user -> {
            int current = user.getShopBalance() != null ? user.getShopBalance() : 0;
            user.setShopBalance(current + amount);
            userRepository.save(user);
        });
    }

    @Override
    @Transactional
    public ShopItem createItem(String name, String description, Integer price, String category, Integer stock, MultipartFile image) throws IOException {
        String imageUrl = null;
        if (image != null && !image.isEmpty()) {
            String publicId = "shop_items/" + UUID.randomUUID().toString();
            Map<String, Object> uploadResult = cloudinaryService.upload(image, "codearena/shop", publicId);
            imageUrl = uploadResult.get("secure_url").toString();
        }

        ShopItem item = ShopItem.builder()
                .name(name)
                .description(description)
                .price(price)
                .category(category)
                .stock(stock)
                .imageUrl(imageUrl)
                .isActive(true)
                .build();

        return shopItemRepository.save(item);
    }

    @Override
    public List<ShopItem> getAdminItems() {
        return shopItemRepository.findByIsDeletedFalse();
    }

    @Override
    @Transactional
    public ShopItem updateItem(Integer itemId, String name, String description, Integer price, String category, Integer stock, Boolean isActive, MultipartFile image) throws IOException {
        ShopItem item = shopItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Item not found: " + itemId));

        item.setName(name);
        item.setDescription(description);
        item.setPrice(price);
        item.setCategory(category);
        item.setStock(stock);
        item.setIsActive(isActive);

        if (image != null && !image.isEmpty()) {
            String publicId = "shop_items/" + UUID.randomUUID().toString();
            Map<String, Object> uploadResult = cloudinaryService.upload(image, "codearena/shop", publicId);
            item.setImageUrl(uploadResult.get("secure_url").toString());
        }

        return shopItemRepository.save(item);
    }

    @Override
    @Transactional
    public void deleteItem(Integer itemId) {
        ShopItem item = shopItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Item not found: " + itemId));
        item.setIsDeleted(true);
        item.setIsActive(false);
        shopItemRepository.save(item);
    }
}
