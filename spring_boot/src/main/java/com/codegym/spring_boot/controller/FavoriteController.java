package com.codegym.spring_boot.controller;

import com.codegym.spring_boot.dto.problem.ProblemUserDTO;
import com.codegym.spring_boot.service.IFavoriteService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final IFavoriteService favoriteService;

    @PostMapping("/toggle/{problemId}")
    public ResponseEntity<?> toggleFavorite(@PathVariable Integer problemId) {
        boolean isFavorited = favoriteService.toggleFavorite(problemId);
        Map<String, Object> response = new HashMap<>();
        response.put("isFavorited", isFavorited);
        response.put("message", isFavorited ? "Đã thêm vào danh sách yêu thích" : "Đã xóa khỏi danh sách yêu thích");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-favorite-ids")
    public ResponseEntity<List<Integer>> getMyFavoriteProblemIds() {
        return ResponseEntity.ok(favoriteService.getMyFavoriteProblemIds());
    }

    @GetMapping("/my-favorites")
    public ResponseEntity<Page<ProblemUserDTO>> getMyFavoriteProblems(
            @PageableDefault(size = 5, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(favoriteService.getMyFavoriteProblems(pageable));
    }
}
