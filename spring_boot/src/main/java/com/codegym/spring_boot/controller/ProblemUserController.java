package com.codegym.spring_boot.controller;

import com.codegym.spring_boot.dto.problem.ProblemUserPageWrapperDTO;
import com.codegym.spring_boot.entity.User;
import com.codegym.spring_boot.entity.enums.Difficulty;
import com.codegym.spring_boot.service.IProblemUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public/problems")
@RequiredArgsConstructor
public class ProblemUserController {

    private final IProblemUserService problemUserService;

    @GetMapping
    public ResponseEntity<ProblemUserPageWrapperDTO> getProblemList(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) Difficulty difficulty,
            @RequestParam(required = false) List<Integer> tagIds,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Boolean isFavorite,
            @PageableDefault(size = 5, sort = "id", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(problemUserService.getAllProblemsForUser(title, difficulty, tagIds, status, isFavorite, pageable, currentUser));
    }
}
