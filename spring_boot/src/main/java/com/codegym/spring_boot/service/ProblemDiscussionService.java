package com.codegym.spring_boot.service;

import com.codegym.spring_boot.dto.discussion.request.CreateDiscussionRequest;
import com.codegym.spring_boot.dto.discussion.response.ProblemDiscussionResponse;
import org.springframework.data.domain.Page;

public interface ProblemDiscussionService {
    Page<ProblemDiscussionResponse> getDiscussionsByProblem(Integer problemId, int page, int size);

    ProblemDiscussionResponse createDiscussion(Integer problemId, CreateDiscussionRequest request, Integer userId);

    ProblemDiscussionResponse updateDiscussion(Integer discussionId, CreateDiscussionRequest request, Integer userId);

    Page<ProblemDiscussionResponse> getAllDiscussions(Integer problemId, int page, int size);

    void deleteDiscussion(Integer discussionId, Integer userId);
}
