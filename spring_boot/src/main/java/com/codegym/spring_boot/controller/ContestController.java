package com.codegym.spring_boot.controller;

import com.codegym.spring_boot.dto.contest.request.AddProblemsRequest;
import com.codegym.spring_boot.dto.contest.request.CreateContestRequest;
import com.codegym.spring_boot.dto.contest.request.ExtendContestRequest;
import com.codegym.spring_boot.dto.contest.request.FreezeProblemRequest;
import com.codegym.spring_boot.dto.contest.request.UnfreezeProblemRequest;
import com.codegym.spring_boot.dto.contest.request.UpdateContestRequest;
import com.codegym.spring_boot.dto.contest.response.ContestDetailResponse;
import com.codegym.spring_boot.dto.contest.response.ContestListResponse;
import com.codegym.spring_boot.entity.User;
import com.codegym.spring_boot.service.ContestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/contests")
@RequiredArgsConstructor
public class ContestController {

    private final ContestService contestService;

    // =============================================
    // MODERATOR/ADMIN APIs
    // =============================================

    @PostMapping
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    public ResponseEntity<ContestDetailResponse> createContest(
            @Valid @RequestBody CreateContestRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(contestService.createContest(request, currentUser));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    public ResponseEntity<ContestDetailResponse> updateContest(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateContestRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(contestService.updateContest(id, request, currentUser));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    public ResponseEntity<Map<String, String>> cancelContest(
            @PathVariable Integer id,
            @AuthenticationPrincipal User currentUser) {
        contestService.cancelContest(id, currentUser);
        return ResponseEntity.ok(Map.of("message", "Cuộc thi đã được hủy thành công."));
    }

    @PostMapping("/{id}/problems")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    public ResponseEntity<Map<String, String>> addProblems(
            @PathVariable Integer id,
            @Valid @RequestBody AddProblemsRequest request,
            @AuthenticationPrincipal User currentUser) {
        contestService.addProblems(id, request, currentUser);
        return ResponseEntity.ok(Map.of("message", "Đã thêm bài tập vào cuộc thi thành công."));
    }

    @DeleteMapping("/{id}/problems/{problemId}")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    public ResponseEntity<Map<String, String>> removeProblem(
            @PathVariable Integer id,
            @PathVariable Integer problemId,
            @AuthenticationPrincipal User currentUser) {
        contestService.removeProblem(id, problemId, currentUser);
        return ResponseEntity.ok(Map.of("message", "Đã xóa bài tập khỏi cuộc thi thành công."));
    }

    @PatchMapping("/{id}/problems/{problemId}/freeze")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    public ResponseEntity<Map<String, String>> freezeProblem(
            @PathVariable Integer id,
            @PathVariable Integer problemId,
            @Valid @RequestBody FreezeProblemRequest request,
            @AuthenticationPrincipal User currentUser) {
        contestService.freezeProblem(id, problemId, request.getReason(), currentUser);
        return ResponseEntity.ok(Map.of("message", "Bài tập đã được đóng băng thành công."));
    }

    @PatchMapping("/{id}/problems/{problemId}/unfreeze")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    public ResponseEntity<Map<String, String>> unfreezeProblem(
            @PathVariable Integer id,
            @PathVariable Integer problemId,
            @RequestBody(required = false) UnfreezeProblemRequest request,
            @AuthenticationPrincipal User currentUser) {
        boolean triggerRejudge = request != null && request.isTriggerRejudge();
        contestService.unfreezeProblem(id, problemId, triggerRejudge, currentUser);
        return ResponseEntity.ok(Map.of("message", "Bài tập đã được mở băng thành công."));
    }

    @PatchMapping("/{id}/extend")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    public ResponseEntity<ContestDetailResponse> extendContest(
            @PathVariable Integer id,
            @Valid @RequestBody ExtendContestRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(contestService.extendContest(id, request.getMinutesToAdd(), currentUser));
    }

    // =============================================
    // PUBLIC / USER APIs
    // =============================================

    @GetMapping
    public ResponseEntity<Page<ContestListResponse>> getContests(
            @RequestParam(required = false) String status,
            @PageableDefault(size = 10, sort = "startTime", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(contestService.getContests(status, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContestDetailResponse> getContestDetail(
            @PathVariable Integer id,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(contestService.getContestDetail(id, currentUser));
    }

    @PostMapping("/{id}/register")
    public ResponseEntity<Map<String, String>> registerForContest(
            @PathVariable Integer id,
            @AuthenticationPrincipal User currentUser) {
        contestService.registerForContest(id, currentUser);
        return ResponseEntity.ok(Map.of("message", "Đăng ký cuộc thi thành công!"));
    }
}
