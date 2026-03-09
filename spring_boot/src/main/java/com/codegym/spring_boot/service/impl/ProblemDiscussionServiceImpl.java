package com.codegym.spring_boot.service.impl;

import com.codegym.spring_boot.dto.discussion.request.CreateDiscussionRequest;
import com.codegym.spring_boot.dto.discussion.response.ProblemDiscussionResponse;
import com.codegym.spring_boot.entity.Problem;
import com.codegym.spring_boot.entity.ProblemDiscussion;
import com.codegym.spring_boot.entity.User;
import com.codegym.spring_boot.repository.ProblemDiscussionRepository;
import com.codegym.spring_boot.repository.IProblemRepository;
import com.codegym.spring_boot.repository.UserRepository;
import com.codegym.spring_boot.service.ProblemDiscussionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProblemDiscussionServiceImpl implements ProblemDiscussionService {

        private final ProblemDiscussionRepository discussionRepository;
        private final IProblemRepository problemRepository;
        private final UserRepository userRepository;

        @Override
        public Page<ProblemDiscussionResponse> getDiscussionsByProblem(Integer problemId, int page, int size) {
                Page<ProblemDiscussion> discussions = discussionRepository.findByProblemIdOrderByCreatedAtDesc(
                                problemId,
                                PageRequest.of(page, size));
                return discussions.map(this::mapToResponse);
        }

        @Override
        @Transactional
        public ProblemDiscussionResponse createDiscussion(Integer problemId, CreateDiscussionRequest request,
                        Integer userId) {
                Problem problem = problemRepository.findById(problemId)
                                .orElseThrow(() -> new RuntimeException("Problem not found"));
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                ProblemDiscussion discussion = ProblemDiscussion.builder()
                                .problem(problem)
                                .user(user)
                                .content(request.getContent())
                                .build();

                discussion = discussionRepository.save(discussion);
                return mapToResponse(discussion);
        }

        @Override
        @Transactional
        public void deleteDiscussion(Integer discussionId, Integer userId) {
                ProblemDiscussion discussion = discussionRepository.findById(discussionId)
                                .orElseThrow(() -> new RuntimeException("Discussion not found"));

                // Cần cho phép Admin xóa hoặc người tạo ra xóa
                if (!discussion.getUser().getId().equals(userId)) {
                        // Check nếu không phải Mod/Admin
                        User user = userRepository.findById(userId).orElseThrow();
                        if (!user.getRole().name().equals("ADMIN") && !user.getRole().name().equals("MODERATOR")) {
                                throw new RuntimeException("You don't have permission to delete this discussion");
                        }
                }

                discussionRepository.delete(discussion);
        }

        private ProblemDiscussionResponse mapToResponse(ProblemDiscussion discussion) {
                return ProblemDiscussionResponse.builder()
                                .id(discussion.getId())
                                .problemId(discussion.getProblem().getId())
                                .userId(discussion.getUser().getId())
                                .userFullName(discussion.getUser().getFullName())
                                .userUsername(discussion.getUser().getUsername())
                                .userAvatar(discussion.getUser().getProfile() != null
                                                ? discussion.getUser().getProfile().getAvatarUrl()
                                                : null)
                                .content(discussion.getContent())
                                .createdAt(discussion.getCreatedAt())
                                .build();
        }
}
