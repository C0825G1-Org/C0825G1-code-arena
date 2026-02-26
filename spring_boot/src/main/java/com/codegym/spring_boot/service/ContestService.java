package com.codegym.spring_boot.service;

import com.codegym.spring_boot.dto.contest.request.AddProblemsRequest;
import com.codegym.spring_boot.dto.contest.request.CreateContestRequest;
import com.codegym.spring_boot.dto.contest.request.UpdateContestRequest;
import com.codegym.spring_boot.dto.contest.response.ContestDetailResponse;
import com.codegym.spring_boot.dto.contest.response.ContestListResponse;
import com.codegym.spring_boot.entity.*;
import com.codegym.spring_boot.entity.enums.ContestStatus;
import com.codegym.spring_boot.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContestService {

    private final ContestRepository contestRepository;
    private final ContestParticipantRepository participantRepository;
    private final ContestProblemRepository problemRepository;

    // =============================================
    // 1. MODERATOR/ADMIN: Tạo cuộc thi
    // =============================================
    @Transactional
    public ContestDetailResponse createContest(CreateContestRequest request, User currentUser) {
        // Validate: startTime phải cách hiện tại ít nhất 5 phút
        if (request.getStartTime().isBefore(LocalDateTime.now().plusMinutes(5))) {
            throw new IllegalArgumentException("Thời gian bắt đầu phải cách thời điểm hiện tại ít nhất 5 phút.");
        }
        // Validate: endTime phải sau startTime
        if (!request.getEndTime().isAfter(request.getStartTime())) {
            throw new IllegalArgumentException("Thời gian kết thúc phải sau thời gian bắt đầu.");
        }

        Contest contest = new Contest();
        contest.setTitle(request.getTitle());
        contest.setDescription(request.getDescription());
        contest.setStartTime(request.getStartTime());
        contest.setEndTime(request.getEndTime());
        contest.setStatus(ContestStatus.upcoming);
        contest.setCreatedBy(currentUser);

        contest = contestRepository.save(contest);
        return mapToDetailResponse(contest, false);
    }

    // =============================================
    // 2. MODERATOR/ADMIN: Cập nhật cuộc thi (State Machine)
    // =============================================
    @Transactional
    public ContestDetailResponse updateContest(Integer id, UpdateContestRequest request, User currentUser) {
        Contest contest = findContestOrThrow(id);
        checkOwnership(contest, currentUser);

        // Tính status thực tế theo thời gian
        ContestStatus realStatus = computeRealTimeStatus(contest);

        switch (realStatus) {
            case finished:
                throw new IllegalStateException("Không thể chỉnh sửa cuộc thi đã kết thúc.");

            case active:
                // Chỉ cho sửa title, description, endTime
                if (request.getStartTime() != null) {
                    throw new IllegalStateException("Không thể thay đổi thời gian bắt đầu khi cuộc thi đang diễn ra.");
                }
                if (request.getEndTime() != null) {
                    if (!request.getEndTime().isAfter(LocalDateTime.now())) {
                        throw new IllegalArgumentException("Thời gian kết thúc mới phải ở tương lai.");
                    }
                    contest.setEndTime(request.getEndTime());
                }
                if (request.getTitle() != null)
                    contest.setTitle(request.getTitle());
                if (request.getDescription() != null)
                    contest.setDescription(request.getDescription());
                break;

            case upcoming:
                // Cho phép sửa tất cả
                if (request.getTitle() != null)
                    contest.setTitle(request.getTitle());
                if (request.getDescription() != null)
                    contest.setDescription(request.getDescription());
                if (request.getStartTime() != null) {
                    if (request.getStartTime().isBefore(LocalDateTime.now().plusMinutes(5))) {
                        throw new IllegalArgumentException("Thời gian bắt đầu phải cách hiện tại ít nhất 5 phút.");
                    }
                    contest.setStartTime(request.getStartTime());
                }
                if (request.getEndTime() != null) {
                    LocalDateTime effectiveStart = request.getStartTime() != null
                            ? request.getStartTime()
                            : contest.getStartTime();
                    if (!request.getEndTime().isAfter(effectiveStart)) {
                        throw new IllegalArgumentException("Thời gian kết thúc phải sau thời gian bắt đầu.");
                    }
                    contest.setEndTime(request.getEndTime());
                }
                break;

            case cancelled:
                throw new IllegalStateException("Không thể chỉnh sửa cuộc thi đã bị hủy.");
        }

        contest = contestRepository.save(contest);
        return mapToDetailResponse(contest, false);
    }

    // =============================================
    // 3. MODERATOR/ADMIN: Hủy cuộc thi (Soft Delete)
    // =============================================
    @Transactional
    public void cancelContest(Integer id, User currentUser) {
        Contest contest = findContestOrThrow(id);
        checkOwnership(contest, currentUser);

        ContestStatus realStatus = computeRealTimeStatus(contest);
        if (realStatus != ContestStatus.upcoming) {
            throw new IllegalStateException("Chỉ có thể hủy cuộc thi đang ở trạng thái UPCOMING.");
        }

        contest.setStatus(ContestStatus.cancelled);
        contest.setIsDeleted(true);
        contestRepository.save(contest);
    }

    // =============================================
    // 4. MODERATOR/ADMIN: Thêm bài tập vào Contest
    // =============================================
    @Transactional
    public void addProblems(Integer contestId, AddProblemsRequest request, User currentUser) {
        Contest contest = findContestOrThrow(contestId);
        checkOwnership(contest, currentUser);

        ContestStatus realStatus = computeRealTimeStatus(contest);
        if (realStatus == ContestStatus.finished || realStatus == ContestStatus.cancelled) {
            throw new IllegalStateException("Không thể thêm bài tập vào cuộc thi đã kết thúc hoặc đã hủy.");
        }

        for (AddProblemsRequest.ProblemEntry entry : request.getProblems()) {
            ContestProblemId cpId = new ContestProblemId(contestId, entry.getProblemId());

            // Kiểm tra trùng lặp
            if (problemRepository.existsById(cpId)) {
                throw new IllegalArgumentException(
                        "Bài tập ID " + entry.getProblemId() + " đã tồn tại trong cuộc thi này.");
            }

            ContestProblem cp = new ContestProblem();
            cp.setId(cpId);
            cp.setContest(contest);
            // Lấy Problem reference thay vì query full
            Problem problem = new Problem();
            problem.setId(entry.getProblemId());
            cp.setProblem(problem);
            cp.setOrderIndex(entry.getOrderIndex());
            problemRepository.save(cp);
        }
    }

    // =============================================
    // 5. MODERATOR/ADMIN: Xóa bài tập khỏi Contest
    // =============================================
    @Transactional
    public void removeProblem(Integer contestId, Integer problemId, User currentUser) {
        Contest contest = findContestOrThrow(contestId);
        checkOwnership(contest, currentUser);

        ContestStatus realStatus = computeRealTimeStatus(contest);
        if (realStatus == ContestStatus.finished || realStatus == ContestStatus.cancelled) {
            throw new IllegalStateException("Không thể xóa bài tập khỏi cuộc thi đã kết thúc hoặc đã hủy.");
        }

        ContestProblemId cpId = new ContestProblemId(contestId, problemId);
        if (!problemRepository.existsById(cpId)) {
            throw new IllegalArgumentException("Bài tập không tồn tại trong cuộc thi này.");
        }
        problemRepository.deleteById(cpId);
    }

    // =============================================
    // 6. MODERATOR/ADMIN: Đóng băng bài tập (Freeze)
    // =============================================
    @Transactional
    public void freezeProblem(Integer contestId, Integer problemId, String reason, User currentUser) {
        Contest contest = findContestOrThrow(contestId);
        checkOwnership(contest, currentUser);

        ContestStatus realStatus = computeRealTimeStatus(contest);
        if (realStatus != ContestStatus.active) {
            throw new IllegalStateException("Chỉ có thể đóng băng bài tập khi cuộc thi đang diễn ra (ACTIVE).");
        }

        ContestProblemId cpId = new ContestProblemId(contestId, problemId);
        ContestProblem cp = problemRepository.findById(cpId)
                .orElseThrow(() -> new IllegalArgumentException("Bài tập không tồn tại trong cuộc thi này."));

        if (Boolean.TRUE.equals(cp.getIsFrozen())) {
            throw new IllegalStateException("Bài tập này đã bị đóng băng trước đó.");
        }

        cp.setIsFrozen(true);
        cp.setFrozenReason(reason);
        problemRepository.save(cp);
        log.info("Problem {} frozen in contest {} by user {}. Reason: {}", problemId, contestId, currentUser.getUsername(), reason);
    }

    // =============================================
    // 7. MODERATOR/ADMIN: Mở băng bài tập (Unfreeze)
    // =============================================
    @Transactional
    public void unfreezeProblem(Integer contestId, Integer problemId, boolean triggerRejudge, User currentUser) {
        Contest contest = findContestOrThrow(contestId);
        checkOwnership(contest, currentUser);

        ContestStatus realStatus = computeRealTimeStatus(contest);
        if (realStatus != ContestStatus.active) {
            throw new IllegalStateException("Chỉ có thể mở băng bài tập khi cuộc thi đang diễn ra (ACTIVE).");
        }

        ContestProblemId cpId = new ContestProblemId(contestId, problemId);
        ContestProblem cp = problemRepository.findById(cpId)
                .orElseThrow(() -> new IllegalArgumentException("Bài tập không tồn tại trong cuộc thi này."));

        if (!Boolean.TRUE.equals(cp.getIsFrozen())) {
            throw new IllegalStateException("Bài tập này chưa bị đóng băng.");
        }

        cp.setIsFrozen(false);
        cp.setFrozenReason(null);
        problemRepository.save(cp);

        if (triggerRejudge) {
            // TODO: Khi Judge system (Dev 3) sẵn sàng, push submissions vào Redis Queue
            log.info("Rejudge triggered for problem {} in contest {} by user {}", problemId, contestId, currentUser.getUsername());
        }

        log.info("Problem {} unfrozen in contest {} by user {}", problemId, contestId, currentUser.getUsername());
    }

    // =============================================
    // 8. MODERATOR/ADMIN: Kéo dài thời gian thi (Extend)
    // =============================================
    @Transactional
    public ContestDetailResponse extendContest(Integer contestId, Integer minutesToAdd, User currentUser) {
        Contest contest = findContestOrThrow(contestId);
        checkOwnership(contest, currentUser);

        ContestStatus realStatus = computeRealTimeStatus(contest);
        if (realStatus != ContestStatus.active) {
            throw new IllegalStateException("Chỉ có thể kéo dài thời gian khi cuộc thi đang diễn ra (ACTIVE).");
        }

        LocalDateTime newEndTime = contest.getEndTime().plusMinutes(minutesToAdd);
        contest.setEndTime(newEndTime);
        contest = contestRepository.save(contest);

        log.info("Contest {} extended by {} minutes. New end time: {}", contestId, minutesToAdd, newEndTime);
        return mapToDetailResponse(contest, false);
    }

    // =============================================
    // 6. USER: Lấy danh sách cuộc thi (Public)
    // =============================================
    public Page<ContestListResponse> getContests(String statusFilter, Pageable pageable) {
        Page<Contest> contests;

        if (statusFilter != null && !statusFilter.isBlank()) {
            try {
                ContestStatus status = ContestStatus.valueOf(statusFilter.toLowerCase());
                contests = contestRepository.findByStatus(status, pageable);
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Trạng thái lọc không hợp lệ: " + statusFilter);
            }
        } else {
            // Mặc định: ẩn CANCELLED
            contests = contestRepository.findByStatusNot(ContestStatus.cancelled, pageable);
        }

        return contests.map(this::mapToListResponse);
    }

    // =============================================
    // 7. USER: Đăng ký tham gia cuộc thi
    // =============================================
    @Transactional
    public void registerForContest(Integer contestId, User currentUser) {
        Contest contest = findContestOrThrow(contestId);
        ContestStatus realStatus = computeRealTimeStatus(contest);

        if (realStatus == ContestStatus.finished || realStatus == ContestStatus.cancelled) {
            throw new IllegalStateException("Không thể đăng ký cuộc thi đã kết thúc hoặc đã hủy.");
        }

        ContestParticipantId cpId = new ContestParticipantId(contestId, currentUser.getId());
        if (participantRepository.existsById(cpId)) {
            throw new IllegalStateException("Bạn đã đăng ký cuộc thi này trước đó.");
        }

        ContestParticipant participant = new ContestParticipant();
        participant.setId(cpId);
        participant.setContest(contest);
        participant.setUser(currentUser);
        participant.setTotalScore(0);
        participant.setTotalPenalty(0);
        participantRepository.save(participant);
    }

    // =============================================
    // 8. USER/PUBLIC: Xem chi tiết cuộc thi
    // =============================================
    public ContestDetailResponse getContestDetail(Integer id, User currentUser) {
        Contest contest = findContestOrThrow(id);
        ContestStatus realStatus = computeRealTimeStatus(contest);

        // Cập nhật status nếu khác DB
        if (contest.getStatus() != realStatus) {
            contest.setStatus(realStatus);
            contestRepository.save(contest);
        }

        boolean isRegistered = false;
        if (currentUser != null) {
            isRegistered = participantRepository.existsById(
                    new ContestParticipantId(id, currentUser.getId()));
        }

        ContestDetailResponse response = mapToDetailResponse(contest, isRegistered);

        // Logic ẩn/hiện Problems dựa trên trạng thái
        switch (realStatus) {
            case upcoming:
                // Tuyệt đối không trả về problems
                response.setProblems(null);
                response.setRanking(null);
                break;

            case active:
                // Chỉ trả về problems nếu đã đăng ký
                if (isRegistered) {
                    response.setProblems(getContestProblems(id));
                } else {
                    response.setProblems(null);
                }
                response.setRanking(null);
                break;

            case finished:
                // Trả về toàn bộ problems + ranking
                response.setProblems(getContestProblems(id));
                response.setRanking(getRanking(id));
                break;

            case cancelled:
                response.setProblems(null);
                response.setRanking(null);
                break;
        }

        return response;
    }

    // =============================================
    // HELPER: Tính status thực tế dựa trên thời gian
    // =============================================
    public ContestStatus computeRealTimeStatus(Contest contest) {
        // Nếu đã Cancelled hoặc Finished trong DB, giữ nguyên
        if (contest.getStatus() == ContestStatus.cancelled) {
            return ContestStatus.cancelled;
        }
        if (contest.getStatus() == ContestStatus.finished) {
            return ContestStatus.finished;
        }

        // Chỉ tính theo thời gian cho upcoming/active
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(contest.getStartTime())) {
            return ContestStatus.upcoming;
        } else if (now.isBefore(contest.getEndTime())) {
            return ContestStatus.active;
        } else {
            return ContestStatus.finished;
        }
    }

    // =============================================
    // HELPER: Kiểm tra quyền sở hữu
    // =============================================
    private void checkOwnership(Contest contest, User currentUser) {
        // ADMIN được phép sửa tất cả
        if (currentUser.getRole().name().equalsIgnoreCase("admin")) {
            return;
        }
        // MODERATOR chỉ được sửa cuộc thi mình tạo
        if (contest.getCreatedBy() == null || !contest.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new SecurityException("Bạn không có quyền chỉnh sửa cuộc thi này.");
        }
    }

    // =============================================
    // MAPPER: Contest → ContestDetailResponse
    // =============================================
    private ContestDetailResponse mapToDetailResponse(Contest contest, boolean isRegistered) {
        return ContestDetailResponse.builder()
                .id(contest.getId())
                .title(contest.getTitle())
                .description(contest.getDescription())
                .status(computeRealTimeStatus(contest).name())
                .startTime(contest.getStartTime())
                .endTime(contest.getEndTime())
                .isRegistered(isRegistered)
                .serverTime(LocalDateTime.now())
                .createdBy(contest.getCreatedBy() != null
                        ? contest.getCreatedBy().getUsername()
                        : null)
                .participantCount(participantRepository.countByIdContestId(contest.getId()))
                .build();
    }

    // =============================================
    // MAPPER: Contest → ContestListResponse
    // =============================================
    private ContestListResponse mapToListResponse(Contest contest) {
        return ContestListResponse.builder()
                .id(contest.getId())
                .title(contest.getTitle())
                .status(computeRealTimeStatus(contest).name())
                .startTime(contest.getStartTime())
                .endTime(contest.getEndTime())
                .participantCount(participantRepository.countByIdContestId(contest.getId()))
                .serverTime(LocalDateTime.now())
                .build();
    }

    // =============================================
    // HELPER: Lấy danh sách Problems
    // =============================================
    private List<ContestDetailResponse.ContestProblemResponse> getContestProblems(Integer contestId) {
        return problemRepository.findByIdContestIdOrderByOrderIndexAsc(contestId)
                .stream()
                .map(cp -> ContestDetailResponse.ContestProblemResponse.builder()
                        .id(cp.getProblem().getId())
                        .orderIndex(cp.getOrderIndex())
                        .title(cp.getProblem().getTitle())
                        .difficulty(cp.getProblem().getDifficulty().name())
                        .isFrozen(Boolean.TRUE.equals(cp.getIsFrozen()))
                        .frozenReason(cp.getFrozenReason())
                        .build())
                .collect(Collectors.toList());
    }

    // =============================================
    // HELPER: Lấy bảng xếp hạng
    // =============================================
    private List<ContestDetailResponse.RankingEntry> getRanking(Integer contestId) {
        List<ContestParticipant> participants = participantRepository
                .findByIdContestIdOrderByTotalScoreDescTotalPenaltyAsc(contestId);

        AtomicInteger rank = new AtomicInteger(1);
        return participants.stream()
                .map(p -> ContestDetailResponse.RankingEntry.builder()
                        .rank(rank.getAndIncrement())
                        .username(p.getUser().getUsername())
                        .totalScore(p.getTotalScore())
                        .totalPenalty(p.getTotalPenalty())
                        .build())
                .collect(Collectors.toList());
    }

    // =============================================
    // HELPER: Tìm Contest hoặc throw 404
    // =============================================
    private Contest findContestOrThrow(Integer id) {
        return contestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy cuộc thi với ID: " + id));
    }
}
