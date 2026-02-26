package com.codegym.spring_boot.service;

import com.codegym.spring_boot.dto.contest.request.AnswerClarificationRequest;
import com.codegym.spring_boot.dto.contest.request.CreateClarificationRequest;
import com.codegym.spring_boot.dto.contest.response.ClarificationResponse;
import com.codegym.spring_boot.entity.*;
import com.codegym.spring_boot.entity.enums.ContestStatus;
import com.codegym.spring_boot.repository.ContestClarificationRepository;
import com.codegym.spring_boot.repository.ContestParticipantRepository;
import com.codegym.spring_boot.repository.ContestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClarificationService {

    private final ContestClarificationRepository clarificationRepository;
    private final ContestRepository contestRepository;
    private final ContestParticipantRepository participantRepository;
    private final ContestService contestService;

    // =============================================
    // 1. THÍS SINH: Gửi câu hỏi (Clarification)
    // =============================================
    @Transactional
    public ClarificationResponse createClarification(Integer contestId, CreateClarificationRequest request, User currentUser) {
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy cuộc thi với ID: " + contestId));

        ContestStatus realStatus = contestService.computeRealTimeStatus(contest);
        if (realStatus != ContestStatus.active) {
            throw new IllegalStateException("Chỉ có thể gửi câu hỏi khi cuộc thi đang diễn ra (ACTIVE).");
        }

        // Kiểm tra đã đăng ký chưa
        ContestParticipantId cpId = new ContestParticipantId(contestId, currentUser.getId());
        if (!participantRepository.existsById(cpId)) {
            throw new IllegalStateException("Bạn chưa đăng ký tham gia cuộc thi này.");
        }

        ContestClarification clarification = new ContestClarification();
        clarification.setContest(contest);
        clarification.setUser(currentUser);
        clarification.setQuestion(request.getQuestion());

        if (request.getProblemId() != null) {
            Problem problem = new Problem();
            problem.setId(request.getProblemId());
            clarification.setProblem(problem);
        }

        clarification = clarificationRepository.save(clarification);
        log.info("Clarification #{} created by user {} in contest {}", clarification.getId(), currentUser.getUsername(), contestId);
        return mapToResponse(clarification);
    }

    // =============================================
    // 2. MODERATOR: Trả lời câu hỏi
    // =============================================
    @Transactional
    public ClarificationResponse answerClarification(Integer contestId, Integer clarificationId, AnswerClarificationRequest request, User currentUser) {
        ContestClarification clarification = clarificationRepository.findById(clarificationId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy câu hỏi với ID: " + clarificationId));

        // Kiểm tra clarification thuộc contest
        if (!clarification.getContest().getId().equals(contestId)) {
            throw new IllegalArgumentException("Câu hỏi không thuộc cuộc thi này.");
        }

        if (clarification.getAnswer() != null) {
            throw new IllegalStateException("Câu hỏi này đã được trả lời trước đó.");
        }

        clarification.setAnswer(request.getAnswer());
        clarification.setIsPublic(request.getIsPublic());
        clarification.setAnsweredAt(LocalDateTime.now());
        clarification.setAnsweredBy(currentUser);

        clarification = clarificationRepository.save(clarification);
        log.info("Clarification #{} answered by {} (public: {})", clarificationId, currentUser.getUsername(), request.getIsPublic());
        return mapToResponse(clarification);
    }

    // =============================================
    // 3. Lấy danh sách Clarifications
    // =============================================
    public List<ClarificationResponse> getClarifications(Integer contestId, User currentUser) {
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy cuộc thi với ID: " + contestId));

        List<ContestClarification> clarifications;

        // ADMIN/MODERATOR xem tất cả
        String role = currentUser.getRole().name();
        if (role.equalsIgnoreCase("admin") || role.equalsIgnoreCase("moderator")) {
            clarifications = clarificationRepository.findByContestIdOrderByCreatedAtDesc(contestId);
        } else {
            // Thí sinh: xem của mình + public
            clarifications = clarificationRepository
                    .findByContestIdAndUserIdOrContestIdAndIsPublicTrueOrderByCreatedAtDesc(
                            contestId, currentUser.getId(), contestId);
        }

        return clarifications.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // =============================================
    // MAPPER
    // =============================================
    private ClarificationResponse mapToResponse(ContestClarification c) {
        return ClarificationResponse.builder()
                .id(c.getId())
                .contestId(c.getContest().getId())
                .problemId(c.getProblem() != null ? c.getProblem().getId() : null)
                .problemTitle(c.getProblem() != null ? c.getProblem().getTitle() : null)
                .askedBy(c.getUser().getUsername())
                .question(c.getQuestion())
                .answer(c.getAnswer())
                .isPublic(Boolean.TRUE.equals(c.getIsPublic()))
                .createdAt(c.getCreatedAt())
                .answeredAt(c.getAnsweredAt())
                .answeredBy(c.getAnsweredBy() != null ? c.getAnsweredBy().getUsername() : null)
                .build();
    }
}
