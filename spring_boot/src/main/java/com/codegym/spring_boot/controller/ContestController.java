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
import com.codegym.spring_boot.dto.leaderboard.LeaderboardDTO;
import com.codegym.spring_boot.entity.enums.ParticipantStatus;
import com.codegym.spring_boot.service.ContestService;
import com.codegym.spring_boot.service.ILeaderboardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;
import java.time.LocalDateTime;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
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
    private final ILeaderboardService leaderboardService;

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

    @PatchMapping("/{id}/freeze")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    public ResponseEntity<ContestDetailResponse> freezeContest(
            @PathVariable Integer id,
            @Valid @RequestBody FreezeProblemRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(contestService.freezeContest(id, request.getReason(), currentUser));
    }

    @PatchMapping("/{id}/unfreeze")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    public ResponseEntity<ContestDetailResponse> unfreezeContest(
            @PathVariable Integer id,
            @RequestBody(required = false) UnfreezeProblemRequest request,
            @AuthenticationPrincipal User currentUser) {
        boolean triggerRejudge = request != null && request.isTriggerRejudge();
        return ResponseEntity.ok(contestService.unfreezeContest(id, triggerRejudge, currentUser));
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
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime,
            @RequestParam(required = false) Boolean manage,
            @AuthenticationPrincipal User currentUser,
            @PageableDefault(size = 10, sort = "startTime", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity
                .ok(contestService.getContests(title, status, startTime, endTime, manage, pageable, currentUser));
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

    @GetMapping("/{id}/leaderboard")
    public ResponseEntity<List<LeaderboardDTO>> getContestLeaderboard(@PathVariable Integer id) {
        return ResponseEntity.ok(leaderboardService.getLeaderboard(id));
    }

    @PostMapping("/{id}/finish")
    public ResponseEntity<Map<String, String>> finishContest(
            @PathVariable Integer id,
            @AuthenticationPrincipal User currentUser,
            @RequestParam(required = false) ParticipantStatus status) {
        contestService.finishContest(id, currentUser, status);
        return ResponseEntity.ok(Map.of("message", "Kết thúc cuộc thi thành công!"));
    }

    @PostMapping("/{id}/violation")
    public ResponseEntity<Map<String, Object>> reportViolation(
            @PathVariable Integer id,
            @AuthenticationPrincipal User currentUser,
            @RequestParam(required = false, defaultValue = "false") boolean force) {
        var participant = contestService.reportViolation(id, currentUser, force);
        return ResponseEntity.ok(Map.of(
                "violationCount", participant.getViolationCount(),
                "status", participant.getStatus(),
                "hasScorePenalty", participant.getHasScorePenalty()));
    }
}
