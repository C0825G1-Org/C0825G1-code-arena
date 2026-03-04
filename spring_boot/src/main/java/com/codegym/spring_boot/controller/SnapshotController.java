package com.codegym.spring_boot.controller;

import com.codegym.spring_boot.entity.User;
import com.codegym.spring_boot.service.SnapshotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/snapshots")
@RequiredArgsConstructor
public class SnapshotController {
    private final SnapshotService snapshotService;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadSnapshot(
            @RequestParam("contestId") Integer contestId,
            @RequestParam("image") MultipartFile file,
            @AuthenticationPrincipal User currentUser) {

        try {
            snapshotService.saveSnapshot(contestId, currentUser, file);
            return ResponseEntity.ok(Map.of("message", "Đã lưu ảnh snapshot."));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Lỗi khi lưu ảnh: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/contest/{contestId}/user/{userId}")
    public ResponseEntity<?> getSnapshots(
            @PathVariable Integer contestId,
            @PathVariable Integer userId,
            @AuthenticationPrincipal User currentUser) {

        // Chỉ Moderator hoặc Admin mới được xem
        String role = currentUser.getRole().name();
        if (!role.equalsIgnoreCase("ADMIN") && !role.equalsIgnoreCase("MODERATOR")) {
            return ResponseEntity.status(403).body(Map.of("error", "Chỉ Giám thị mới có quyền xem ảnh giám sát."));
        }

        var snapshots = snapshotService.getSnapshotsByContestAndUser(contestId, userId);
        
        var responseList = snapshots.stream().map(s -> Map.of(
            "id", s.getId(),
            "fileName", s.getFileName(),
            "imageUrl", s.getImageUrl(),
            "capturedAt", s.getCapturedAt().toString()
        )).toList();

        return ResponseEntity.ok(responseList);
    }
}
