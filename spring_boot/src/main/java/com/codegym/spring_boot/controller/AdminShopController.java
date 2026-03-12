package com.codegym.spring_boot.controller;

import com.codegym.spring_boot.entity.ShopItem;
import com.codegym.spring_boot.service.IShopService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/admin/shop")
@RequiredArgsConstructor
public class AdminShopController {

    private final IShopService shopService;

    @Operation(summary = "Get all shop items for admin", description = "Allows admins to see all items including inactive ones.")
    @GetMapping("/items")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<java.util.List<ShopItem>> listItems() {
        return ResponseEntity.ok(shopService.getAdminItems());
    }

    @Operation(summary = "Create a shop item", description = "Allows admins to create a shop item with an optional image upload.")
    @PostMapping("/items")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ShopItem> createItem(
            @RequestParam String name,
            @RequestParam(required = false) String description,
            @RequestParam Integer price,
            @RequestParam String category,
            @RequestParam(defaultValue = "-1") Integer stock,
            @RequestPart(value = "image", required = false) MultipartFile image) throws IOException {
        
        return ResponseEntity.ok(shopService.createItem(name, description, price, category, stock, image));
    }

    @Operation(summary = "Update a shop item", description = "Allows admins to update a shop item including image.")
    @PutMapping("/items/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ShopItem> updateItem(
            @PathVariable Integer id,
            @RequestParam String name,
            @RequestParam(required = false) String description,
            @RequestParam Integer price,
            @RequestParam String category,
            @RequestParam Integer stock,
            @RequestParam Boolean isActive,
            @RequestPart(value = "image", required = false) MultipartFile image) throws IOException {
        
        return ResponseEntity.ok(shopService.updateItem(id, name, description, price, category, stock, isActive, image));
    }

    @Operation(summary = "Delete a shop item", description = "Allows admins to soft delete a shop item.")
    @DeleteMapping("/items/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteItem(@PathVariable Integer id) {
        shopService.deleteItem(id);
        return ResponseEntity.ok().build();
    }
}
