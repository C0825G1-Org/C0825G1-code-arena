package com.codegym.spring_boot.controller;

import com.codegym.spring_boot.dto.discussion.request.CreateDiscussionRequest;
import com.codegym.spring_boot.dto.discussion.response.ProblemDiscussionResponse;
import com.codegym.spring_boot.entity.User;
import com.codegym.spring_boot.service.ProblemDiscussionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/problems/{problemId}/discussions")
@RequiredArgsConstructor
public class ProblemDiscussionController {

    private final ProblemDiscussionService discussionService;

    @GetMapping
    public ResponseEntity<Page<ProblemDiscussionResponse>> getDiscussions(
            @PathVariable Integer problemId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<ProblemDiscussionResponse> discussions = discussionService.getDiscussionsByProblem(problemId, page, size);
        return ResponseEntity.ok(discussions);
    }

    @PostMapping
    public ResponseEntity<ProblemDiscussionResponse> createDiscussion(
            @PathVariable Integer problemId,
            @Valid @RequestBody CreateDiscussionRequest request,
            @AuthenticationPrincipal User user) {
        ProblemDiscussionResponse response = discussionService.createDiscussion(problemId, request, user.getId());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{discussionId}")
    public ResponseEntity<Void> deleteDiscussion(
            @PathVariable Integer problemId,
            @PathVariable Integer discussionId,
            @AuthenticationPrincipal User user) {
        discussionService.deleteDiscussion(discussionId, user.getId());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{discussionId}")
    public ResponseEntity<ProblemDiscussionResponse> updateDiscussion(
            @PathVariable Integer problemId,
            @PathVariable Integer discussionId,
            @Valid @RequestBody CreateDiscussionRequest request,
            @AuthenticationPrincipal User user) {
        ProblemDiscussionResponse response = discussionService.updateDiscussion(discussionId, request, user.getId());
        return ResponseEntity.ok(response);
    }
}
