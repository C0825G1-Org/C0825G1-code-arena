package com.codegym.spring_boot.controller;

import com.codegym.spring_boot.dto.admin.AdminUserDTO;
import com.codegym.spring_boot.service.IAdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final IAdminUserService adminUserService;

    /**
     * GET /api/admin/users?search=&role=&page=0&size=10
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<AdminUserDTO>> getUsers(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "") String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(adminUserService.getUsers(search, role, page, size));
    }

    /**
     * PUT /api/admin/users/{id}/promote  — USER → MODERATOR
     */
    @PutMapping("/{id}/promote")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> promote(@PathVariable Integer id) {
        adminUserService.promoteToModerator(id);
        return ResponseEntity.ok().build();
    }

    /**
     * PUT /api/admin/users/{id}/demote  — MODERATOR → USER
     */
    @PutMapping("/{id}/demote")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> demote(@PathVariable Integer id) {
        adminUserService.demoteToUser(id);
        return ResponseEntity.ok().build();
    }

    /**
     * PUT /api/admin/users/{id}/toggle-lock  — Ban / Unban
     */
    @PutMapping("/{id}/toggle-lock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> toggleLock(@PathVariable Integer id) {
        adminUserService.toggleLock(id);
        return ResponseEntity.ok().build();
    }
}
