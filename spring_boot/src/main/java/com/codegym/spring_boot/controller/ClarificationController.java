package com.codegym.spring_boot.controller;

import com.codegym.spring_boot.dto.contest.request.AnswerClarificationRequest;
import com.codegym.spring_boot.dto.contest.request.CreateClarificationRequest;
import com.codegym.spring_boot.dto.contest.response.ClarificationResponse;
import com.codegym.spring_boot.entity.User;
import com.codegym.spring_boot.service.ClarificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contests/{contestId}/clarifications")
@RequiredArgsConstructor
public class ClarificationController {

    private final ClarificationService clarificationService;

    // Thí sinh gửi câu hỏi (phải đăng ký contest + contest phải ACTIVE)
    @PostMapping
    public ResponseEntity<ClarificationResponse> createClarification(
            @PathVariable Integer contestId,
            @Valid @RequestBody CreateClarificationRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(clarificationService.createClarification(contestId, request, currentUser));
    }

    // Lấy danh sách clarifications (role-based: admin/mod xem tất cả, user xem của mình + public)
    @GetMapping
    public ResponseEntity<List<ClarificationResponse>> getClarifications(
            @PathVariable Integer contestId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(clarificationService.getClarifications(contestId, currentUser));
    }

    // Moderator/Admin trả lời câu hỏi
    @PatchMapping("/{clarificationId}")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    public ResponseEntity<ClarificationResponse> answerClarification(
            @PathVariable Integer contestId,
            @PathVariable Integer clarificationId,
            @Valid @RequestBody AnswerClarificationRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(
                clarificationService.answerClarification(contestId, clarificationId, request, currentUser));
    }
}
