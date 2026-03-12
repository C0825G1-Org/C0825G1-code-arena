package com.codegym.spring_boot.service;

import com.codegym.spring_boot.dto.contest.request.AddProblemsRequest;
import com.codegym.spring_boot.dto.contest.request.CreateContestRequest;
import com.codegym.spring_boot.dto.contest.request.UpdateContestRequest;
import com.codegym.spring_boot.dto.contest.response.ContestDetailResponse;
import com.codegym.spring_boot.dto.contest.response.ContestListResponse;
import com.codegym.spring_boot.entity.*;
import com.codegym.spring_boot.entity.enums.ContestStatus;
import com.codegym.spring_boot.entity.enums.ParticipantStatus;
import com.codegym.spring_boot.entity.enums.TestCaseStatus;
import com.codegym.spring_boot.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;

import com.codegym.spring_boot.scheduler.ContestEventScheduler;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContestService {

    private final ContestRepository contestRepository;
    private final ContestParticipantRepository participantRepository;
    private final ContestProblemRepository problemRepository;
    private final IProblemRepository iProblemRepository;
    private final ContestEventScheduler contestEventScheduler;
    private final SubmissionRepository submissionRepository; // Để kiểm tra run count và submit status
    private final NotificationService notificationService;
    private final ITestCaseRepository testCaseRepository;
    private final ISubscriptionService subscriptionService;

    // =============================================
    // 1. MODERATOR/ADMIN: Tạo cuộc thi
    // =============================================
    @Transactional
    public ContestDetailResponse createContest(CreateContestRequest request, User currentUser) {
        // Kiểm tra Plan quota
        SubscriptionPlan plan = subscriptionService.getUserActivePlan(currentUser.getId());
        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        long contestCountThisMonth = contestRepository.countByCreatedByIdAndStartTimeAfter(currentUser.getId(), startOfMonth);
        
        if (contestCountThisMonth >= plan.getMaxContestsPerMonth()) {
            throw new IllegalStateException("Bạn đã tạo tối đa " + plan.getMaxContestsPerMonth() + " cuộc thi trong tháng này theo gói cước hiện tại. Vui lòng nâng cấp gói để tiếp tục.");
        }

        // Validate: startTime phải cách hiện tại ít nhất 5 phút
        if (request.getStartTime().isBefore(LocalDateTime.now().plusMinutes(5))) {
            throw new IllegalArgumentException("Thời gian bắt đầu phải cách thời điểm hiện tại ít nhất 5 phút.");
        }
        // Validate: endTime phải sau startTime
        if (!request.getEndTime().isAfter(request.getStartTime())) {
            throw new IllegalArgumentException("Thời gian kết thúc phải sau thời gian bắt đầu.");
        }
        // Validate: Thời gian thi tối đa 3 tiếng
        if (java.time.Duration.between(request.getStartTime(), request.getEndTime()).toMinutes() > 180) {
            throw new IllegalArgumentException("Thời gian diễn ra cuộc thi tối đa là 3 tiếng.");
        }

        if (request.getMaxParticipants() != null && request.getMaxParticipants() > plan.getMaxParticipantsPerContest()) {
            throw new IllegalArgumentException("Số lượng thí sinh tối đa cho phép của gói hiện tại là " + plan.getMaxParticipantsPerContest() + ". Vui lòng nâng cấp gói hoặc chọn số lượng thấp hơn.");
        }

        Contest contest = new Contest();
        contest.setTitle(request.getTitle());
        contest.setDescription(request.getDescription());
        contest.setStartTime(request.getStartTime());
        contest.setEndTime(request.getEndTime());
        contest.setStatus(ContestStatus.upcoming);
        contest.setCreatedBy(currentUser);
        contest.setMaxParticipants(request.getMaxParticipants() != null ? request.getMaxParticipants() : 10);

        contest = contestRepository.save(contest);

        // Add problems to the contest
        int orderIndex = 1;
        for (Integer problemId : request.getProblemIds()) {
            Problem problem = iProblemRepository.findById(problemId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài tập với ID: " + problemId));

            if (Boolean.TRUE.equals(problem.getIsDeleted())) {
                throw new IllegalArgumentException("Bài tập ID " + problemId + " đã bị xóa.");
            }

            if (!currentUser.getRole().name().equalsIgnoreCase("admin")) {
                if (problem.getCreatedBy() == null || !problem.getCreatedBy().getId().equals(currentUser.getId())) {
                    throw new SecurityException("Chỉ được thêm bài tập do chính bạn tạo vào cuộc thi. Bài tập ID "
                            + problemId + " không thuộc về bạn.");
                }
            }

            ContestProblem cp = new ContestProblem();
            cp.setId(new ContestProblemId(contest.getId(), problemId));
            cp.setContest(contest);
            cp.setProblem(problem);
            cp.setOrderIndex(orderIndex++);
            problemRepository.save(cp);
        }

        contestEventScheduler.scheduleContestStartEvent(contest.getId(), contest.getStartTime());
        contestEventScheduler.scheduleContestEndEvent(contest.getId(), contest.getEndTime());

        contestEventScheduler.scheduleContestReminder(
                contest.getId(),
                contest.getTitle(),
                contest.getStartTime(),
                Collections.emptyList());

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
                    boolean isStartTimeChanged = contest.getStartTime() == null
                            || !request.getStartTime().truncatedTo(java.time.temporal.ChronoUnit.SECONDS)
                                    .equals(contest.getStartTime().truncatedTo(java.time.temporal.ChronoUnit.SECONDS));
                    if (isStartTimeChanged) {
                        throw new IllegalArgumentException(
                                "Không thể thay đổi thời gian bắt đầu khi cuộc thi đang diễn ra.");
                    }
                }
                if (request.getEndTime() != null) {
                    boolean isEndTimeChanged = contest.getEndTime() == null
                            || !request.getEndTime().truncatedTo(java.time.temporal.ChronoUnit.SECONDS)
                                    .equals(contest.getEndTime().truncatedTo(java.time.temporal.ChronoUnit.SECONDS));
                    if (isEndTimeChanged) {
                        if (request.getEndTime().isBefore(LocalDateTime.now())
                                || request.getEndTime().equals(LocalDateTime.now())) {
                            throw new IllegalArgumentException("Thời gian kết thúc mới phải ở tương lai.");
                        }
                        LocalDateTime effectiveStart = request.getStartTime() != null ? request.getStartTime()
                                : contest.getStartTime();
                        if (java.time.Duration.between(effectiveStart, request.getEndTime()).toMinutes() > 180) {
                            throw new IllegalArgumentException("Thời gian diễn ra cuộc thi tối đa là 3 tiếng.");
                        }
                        contest.setEndTime(request.getEndTime());
                    }
                }
                if (request.getMaxParticipants() != null) {
                    SubscriptionPlan plan = subscriptionService.getUserActivePlan(currentUser.getId());
                    if (request.getMaxParticipants() > plan.getMaxParticipantsPerContest()) {
                        throw new IllegalArgumentException("Số lượng thí sinh tối đa cho phép của gói hiện tại là " + plan.getMaxParticipantsPerContest());
                    }
                    contest.setMaxParticipants(request.getMaxParticipants());
                }
                if (request.getTitle() != null && !request.getTitle().trim().isEmpty()) {
                    contest.setTitle(request.getTitle());
                }
                if (request.getDescription() != null) {
                    contest.setDescription(request.getDescription());
                }
                break;

            case upcoming:
                // Cho phép sửa tất cả
                if (request.getTitle() != null && !request.getTitle().trim().isEmpty()) {
                    contest.setTitle(request.getTitle());
                }
                if (request.getDescription() != null) {
                    contest.setDescription(request.getDescription());
                }
                if (request.getStartTime() != null) {
                    boolean isStartTimeChanged = contest.getStartTime() == null
                            || !request.getStartTime().truncatedTo(java.time.temporal.ChronoUnit.SECONDS)
                                    .equals(contest.getStartTime().truncatedTo(java.time.temporal.ChronoUnit.SECONDS));
                    if (isStartTimeChanged) {
                        if (request.getStartTime().isBefore(LocalDateTime.now().plusMinutes(5))) {
                            throw new IllegalArgumentException("Thời gian bắt đầu phải cách hiện tại ít nhất 5 phút.");
                        }
                        contest.setStartTime(request.getStartTime());
                    }
                }
                if (request.getEndTime() != null) {
                    boolean isEndTimeChanged = contest.getEndTime() == null
                            || !request.getEndTime().truncatedTo(java.time.temporal.ChronoUnit.SECONDS)
                                    .equals(contest.getEndTime().truncatedTo(java.time.temporal.ChronoUnit.SECONDS));
                    if (isEndTimeChanged) {
                        LocalDateTime effectiveStart = request.getStartTime() != null ? request.getStartTime()
                                : contest.getStartTime();
                        if (request.getEndTime().isBefore(effectiveStart)
                                || request.getEndTime().equals(effectiveStart)) {
                            throw new IllegalArgumentException("Thời gian kết thúc phải sau thời gian bắt đầu.");
                        }
                        if (java.time.Duration.between(effectiveStart, request.getEndTime()).toMinutes() > 180) {
                            throw new IllegalArgumentException("Thời gian diễn ra cuộc thi tối đa là 3 tiếng.");
                        }
                        contest.setEndTime(request.getEndTime());
                    }
                }
                break;

            case cancelled:
                throw new IllegalStateException("Không thể chỉnh sửa cuộc thi đã bị hủy.");
        }

        contest = contestRepository.save(contest);
        contestEventScheduler.scheduleContestStartEvent(contest.getId(), contest.getStartTime());
        contestEventScheduler.scheduleContestEndEvent(contest.getId(), contest.getEndTime());

        // Reschedule reminder với startTime mới (lấy lại danh sách participant hiện
        // tại)
        List<Integer> participantIds = participantRepository
                .findByIdContestId(contest.getId())
                .stream()
                .map(cp -> cp.getId().getUserId())
                .toList();
        contestEventScheduler.scheduleContestReminder(
                contest.getId(),
                contest.getTitle(),
                contest.getStartTime(),
                participantIds);

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
        contestEventScheduler.cancelAllSchedules(id);

        // Unlock tất cả problems của contest bị hủy
        unlockProblemsOfContest(id);
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
        // Khi ACTIVE, phải Freeze trước mới được sửa danh sách bài
        if (realStatus == ContestStatus.active && !Boolean.TRUE.equals(contest.getIsFrozen())) {
            throw new IllegalStateException("Phải đóng băng cuộc thi (Freeze) trước khi thêm/xóa bài tập.");
        }

        for (AddProblemsRequest.ProblemEntry entry : request.getProblems()) {
            // Kiểm tra problem tồn tại và chưa bị xóa
            Problem problem = iProblemRepository.findById(entry.getProblemId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Không tìm thấy bài tập với ID: " + entry.getProblemId()));

            if (Boolean.TRUE.equals(problem.getIsDeleted())) {
                throw new IllegalArgumentException(
                        "Bài tập ID " + entry.getProblemId() + " đã bị xóa.");
            }

            // Kiểm tra quyền sở hữu: chỉ được thêm bài của chính mình (ADMIN miễn trừ)
            if (!currentUser.getRole().name().equalsIgnoreCase("admin")) {
                if (problem.getCreatedBy() == null || !problem.getCreatedBy().getId().equals(currentUser.getId())) {
                    throw new SecurityException(
                            "Chỉ được thêm bài tập do chính bạn tạo vào cuộc thi. Bài tập ID " + entry.getProblemId()
                                    + " không thuộc về bạn.");
                }
            }

            // Kiểm tra bài tập phải có testcase
            if (problem.getTestcaseStatus() != TestCaseStatus.ready) {
                throw new IllegalArgumentException(
                        "Bài tập ID " + entry.getProblemId()
                                + " chưa có testcase nào. Vui lòng thêm testcase trước khi đưa vào cuộc thi.");
            }

            // Kiểm tra trùng lặp
            ContestProblemId cpId = new ContestProblemId(contestId, entry.getProblemId());
            if (problemRepository.existsById(cpId)) {
                throw new IllegalArgumentException(
                        "Bài tập ID " + entry.getProblemId() + " đã tồn tại trong cuộc thi này.");
            }

            // Tạo liên kết contest ↔ problem
            ContestProblem cp = new ContestProblem();
            cp.setId(cpId);
            cp.setContest(contest);
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
        // Khi ACTIVE, phải Freeze trước mới được sửa danh sách bài
        if (realStatus == ContestStatus.active && !Boolean.TRUE.equals(contest.getIsFrozen())) {
            throw new IllegalStateException("Phải đóng băng cuộc thi (Freeze) trước khi thêm/xóa bài tập.");
        }

        ContestProblemId cpId = new ContestProblemId(contestId, problemId);
        if (!problemRepository.existsById(cpId)) {
            throw new IllegalArgumentException("Bài tập không tồn tại trong cuộc thi này.");
        }

        long currentProblemCount = problemRepository.countByIdContestId(contestId);
        if (currentProblemCount <= 1) {
            throw new IllegalStateException("Không thể xóa. Cần ít nhất 1 bài tập trong cuộc thi.");
        }

        problemRepository.deleteById(cpId);

        // Unlock problem nếu không còn trong contest ACTIVE/UPCOMING nào khác
        long activeContestCount = problemRepository.countByIdProblemId(problemId);
        if (activeContestCount == 0) {
            iProblemRepository.findById(problemId).ifPresent(problem -> {
                problem.setIsLocked(false);
                iProblemRepository.save(problem);
                log.info("Problem {} unlocked (removed from all contests)", problemId);
            });
        }
    }

    // =============================================
    // 6. MODERATOR/ADMIN: Đóng băng cuộc thi (Freeze)
    // Mở khóa tất cả problems để moderator sửa
    // =============================================
    @Transactional
    public ContestDetailResponse freezeContest(Integer contestId, String reason, User currentUser) {
        Contest contest = findContestOrThrow(contestId);
        checkOwnership(contest, currentUser);

        ContestStatus realStatus = computeRealTimeStatus(contest);
        if (realStatus != ContestStatus.active) {
            throw new IllegalStateException("Chỉ có thể đóng băng khi cuộc thi đang diễn ra (ACTIVE).");
        }
        if (Boolean.TRUE.equals(contest.getIsFrozen())) {
            throw new IllegalStateException("Cuộc thi đã đang trong trạng thái đóng băng.");
        }

        contest.setIsFrozen(true);
        contest.setFrozenReason(reason);
        contest = contestRepository.save(contest);

        // Unlock tất cả problems để moderator có thể sửa
        unlockProblemsOfContest(contestId);
        log.info("Contest {} frozen by {}. Reason: {}", contestId, currentUser.getUsername(), reason);
        return mapToDetailResponse(contest, false);
    }

    // =============================================
    // 7. MODERATOR/ADMIN: Mở băng cuộc thi (Unfreeze)
    // Khóa lại tất cả problems, tiếp tục thi
    // =============================================
    @Transactional
    public ContestDetailResponse unfreezeContest(Integer contestId, boolean triggerRejudge, User currentUser) {
        Contest contest = findContestOrThrow(contestId);
        checkOwnership(contest, currentUser);

        ContestStatus realStatus = computeRealTimeStatus(contest);
        if (realStatus != ContestStatus.active) {
            throw new IllegalStateException("Chỉ có thể mở băng khi cuộc thi đang diễn ra (ACTIVE).");
        }
        if (!Boolean.TRUE.equals(contest.getIsFrozen())) {
            throw new IllegalStateException("Cuộc thi chưa bị đóng băng.");
        }

        contest.setIsFrozen(false);
        contest.setFrozenReason(null);
        contest = contestRepository.save(contest);

        // Lock lại tất cả problems
        lockProblemsOfContest(contestId);

        if (triggerRejudge) {
            // TODO: Khi Judge system (Dev 3) sẵn sàng, push submissions vào Redis Queue
            log.info("Rejudge triggered for contest {} by user {}", contestId, currentUser.getUsername());
        }

        log.info("Contest {} unfrozen by {}", contestId, currentUser.getUsername());
        return mapToDetailResponse(contest, false);
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
    @Transactional(readOnly = true)
    public Page<ContestListResponse> getContests(
            String title, String statusFilter, LocalDateTime startTime, LocalDateTime endTime,
            Boolean manage, Pageable pageable, User currentUser) {

        ContestStatus status = null;
        boolean filterRegistered = false;

        if (statusFilter != null && !statusFilter.isBlank()) {
            if (statusFilter.equalsIgnoreCase("registered")) {
                filterRegistered = true;
            } else {
                try {
                    status = ContestStatus.valueOf(statusFilter.toLowerCase());
                } catch (IllegalArgumentException e) {
                    throw new IllegalArgumentException("Trạng thái lọc không hợp lệ: " + statusFilter);
                }
            }
        }

        final ContestStatus finalStatus = status;
        final boolean finalFilterRegistered = filterRegistered;

        Specification<Contest> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (title != null && !title.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("title")), "%" + title.toLowerCase() + "%"));
            }

            if (finalStatus != null) {
                predicates.add(cb.equal(root.get("status"), finalStatus));
            }

            if (startTime != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("startTime"), startTime));
            }

            if (endTime != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("endTime"), endTime));
            }

            if (Boolean.TRUE.equals(manage) && currentUser != null) {
                if (!currentUser.getRole().name().equalsIgnoreCase("admin")) {
                    predicates.add(cb.equal(root.get("createdBy").get("id"), currentUser.getId()));
                }
                // Always exclude soft-deleted contests in management view
                predicates.add(cb.or(cb.isNull(root.get("isDeleted")), cb.equal(root.get("isDeleted"), false)));
                // Also exclude cancelled contests unless explicitly filtering for them
                if (finalStatus == null) {
                    predicates.add(cb.notEqual(root.get("status"), ContestStatus.cancelled));
                }
            } else {
                if (finalStatus == null) {
                    predicates.add(cb.notEqual(root.get("status"), ContestStatus.cancelled));
                }
                predicates.add(cb.or(cb.isNull(root.get("isDeleted")), cb.equal(root.get("isDeleted"), false)));
            }

            if (finalFilterRegistered && currentUser != null) {
                // Subquery to find if the user has registered for this contest
                jakarta.persistence.criteria.Subquery<Integer> subquery = query.subquery(Integer.class);
                jakarta.persistence.criteria.Root<com.codegym.spring_boot.entity.ContestParticipant> participantRoot = subquery
                        .from(com.codegym.spring_boot.entity.ContestParticipant.class);
                subquery.select(cb.literal(1)).where(
                        cb.equal(participantRoot.get("contest").get("id"), root.get("id")),
                        cb.equal(participantRoot.get("user").get("id"), currentUser.getId()));
                predicates.add(cb.exists(subquery));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Contest> contests = contestRepository.findAll(spec, pageable);

        return contests.map(contest -> {
            boolean isRegistered = false;
            if (currentUser != null) {
                isRegistered = participantRepository.existsById(
                        new ContestParticipantId(contest.getId(), currentUser.getId()));
            }
            return mapToListResponse(contest, isRegistered);
        });
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

        // Check plan limit based on contest creator
        SubscriptionPlan creatorPlan = subscriptionService.getUserActivePlan(contest.getCreatedBy().getId());
        if (participantRepository.countByIdContestId(contestId) >= creatorPlan.getMaxParticipantsPerContest()) {
            throw new IllegalStateException("Cuộc thi đã đủ số lượng người đăng ký tối đa (" + creatorPlan.getMaxParticipantsPerContest() + " người) theo cấu hình gói cước của Host.");
        }

        ContestParticipant participant = new ContestParticipant();
        participant.setId(cpId);
        participant.setContest(contest);
        participant.setUser(currentUser);
        participant.setTotalScore(0);
        participant.setTotalPenalty(0);
        participant.setStatus(ParticipantStatus.JOINED);
        participantRepository.save(participant);

        // Cập nhật lại reminder với danh sách participant mới nhất
        // (chỉ khi contest còn upcoming — active thì không cần nhắc nữa)
        if (realStatus == ContestStatus.upcoming) {
            List<Integer> allParticipantIds = participantRepository
                    .findByIdContestId(contestId)
                    .stream()
                    .map(cp -> cp.getId().getUserId())
                    .toList();
            contestEventScheduler.scheduleContestReminder(
                    contest.getId(),
                    contest.getTitle(),
                    contest.getStartTime(),
                    allParticipantIds);
        }

    }

    // =============================================
    // 8. USER: Kết thúc cuộc thi (Nộp bài tất cả)
    // =============================================
    @Transactional
    public void finishContest(Integer contestId, User currentUser, ParticipantStatus status) {
        ContestParticipant participant = participantRepository.findByContestIdAndUserId(contestId, currentUser.getId())
                .orElseThrow(() -> new IllegalStateException("Bạn chưa đăng ký cuộc thi này."));

        // Nếu đã FINISHED hoặc đã DISQUALIFIED rồi thì không làm gì nữa
        // (Tránh race condition giữa reportViolation và finishContest)
        if (participant.getStatus() == ParticipantStatus.FINISHED
                || participant.getStatus() == ParticipantStatus.DISQUALIFIED) {
            log.info("finishContest skipped: participant {} already has status {}",
                    currentUser.getUsername(), participant.getStatus());
            return;
        }

        participant.setStatus(status != null ? status : ParticipantStatus.FINISHED);
        participantRepository.save(participant);
        log.info("User {} finished contest {}", currentUser.getUsername(), contestId);
    }

    // 9. USER: Báo cáo vi phạm (Rời màn hình / Từ chối camera)
    @Transactional
    public ContestParticipant reportViolation(Integer contestId, User currentUser, boolean force) {
        if (force) {
            participantRepository.forceDisqualify(contestId, currentUser.getId());
        } else {
            participantRepository.incrementViolationCount(contestId, currentUser.getId());
        }

        // Sau đó fetch lại để trả về thông tin mới nhất cho Frontend
        return participantRepository.findByContestIdAndUserId(contestId, currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("Bạn chưa đăng ký cuộc thi này."));
    }

    @Transactional
    public void updateCameraViolationStatus(Integer contestId, Integer userId, boolean isViolating) {
        ContestParticipant participant = participantRepository.findByContestIdAndUserId(contestId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thí sinh trong cuộc thi."));
        participant.setIsCameraViolating(isViolating);
        participantRepository.save(participant);
        log.info("User {} camera violation status updated to {} in contest {}", userId, isViolating, contestId);
    }

    @Transactional
    public void finishContestForUser(Integer contestId, Integer userId, ParticipantStatus status) {
        ContestParticipant participant = participantRepository.findByContestIdAndUserId(contestId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thí sinh trong cuộc thi."));
        participant.setStatus(status);
        participantRepository.save(participant);
        log.info("User {} finished contest {} with status {}", userId, contestId, status);
    }

    // =============================================
    // 10. USER/PUBLIC: Xem chi tiết cuộc thi
    // =============================================
    @Transactional
    public ContestDetailResponse getContestDetail(Integer id, User currentUser) {
        Contest contest = findContestOrThrow(id);
        ContestStatus realStatus = computeRealTimeStatus(contest);

        // Cập nhật status nếu khác DB
        if (contest.getStatus() != realStatus) {
            contest.setStatus(realStatus);
            contestRepository.save(contest);
        }

        boolean isRegistered = false;
        ParticipantStatus participantStatus = null;
        Integer violationCount = 0;
        Boolean hasScorePenalty = false;
        if (currentUser != null) {
            var participantOpt = participantRepository.findByContestIdAndUserId(id, currentUser.getId());
            if (participantOpt.isPresent()) {
                isRegistered = true;
                ContestParticipant p = participantOpt.get();
                participantStatus = p.getStatus();
                violationCount = p.getViolationCount();
                hasScorePenalty = p.getHasScorePenalty();

                // Track "First Join in Active Mode" logic
                if (realStatus == ContestStatus.active && !Boolean.TRUE.equals(p.getHasJoinedActive())) {
                    p.setHasJoinedActive(true);
                    participantRepository.save(p);
                    log.info("Participant {} officially joined active contest {}", currentUser.getUsername(), id);
                    notificationService.sendNewParticipantToMonitor(id);
                }
            }
        }

        ContestDetailResponse response = mapToDetailResponse(contest, isRegistered);
        response.setParticipantStatus(participantStatus);
        response.setViolationCount(violationCount);
        response.setHasScorePenalty(hasScorePenalty);

        // Kiểm tra quyền sở hữu (Admin hoặc Moderator tạo ra contest)
        boolean isOwner = false;
        if (currentUser != null) {
            String roleStr = currentUser.getRole().name();
            if (roleStr.equalsIgnoreCase("admin") ||
                    (roleStr.equalsIgnoreCase("moderator") && contest.getCreatedBy() != null
                            && contest.getCreatedBy().getId().equals(currentUser.getId()))) {
                isOwner = true;
            }
        }

        if (isOwner) {
            response.setProblems(getContestProblems(id));
            if (realStatus == ContestStatus.finished) {
                response.setRanking(getRanking(id));
            } else {
                response.setRanking(null);
            }
        } else {
            // Logic ẩn/hiện Problems dựa trên trạng thái cho User bình thường
            switch (realStatus) {
                case upcoming:
                    // Cho xem List IDs bài tập nếu đang ở phòng chờ (15 phút trước giờ G)
                    if (isRegistered && currentUser != null
                            && LocalDateTime.now().isAfter(contest.getStartTime().minusMinutes(15))) {
                        response.setProblems(getContestProblems(id, currentUser.getId()));
                    } else {
                        response.setProblems(null);
                    }
                    response.setRanking(null);
                    break;

                case active:
                    // Chỉ trả về problems nếu đã đăng ký — enrich với runCount/hasSubmitted
                    if (isRegistered && currentUser != null) {
                        response.setProblems(getContestProblems(id, currentUser.getId()));
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
                .maxParticipants(contest.getMaxParticipants() != null ? contest.getMaxParticipants() : 10)
                .build();
    }

    // =============================================
    // MAPPER: Contest → ContestListResponse
    // =============================================
    private ContestListResponse mapToListResponse(Contest contest, boolean isRegistered) {
        Integer firstProblemId = null;
        var problems = problemRepository.findByIdContestIdOrderByOrderIndexAsc(contest.getId());
        if (problems != null && !problems.isEmpty()) {
            firstProblemId = problems.get(0).getProblem().getId();
        }

        return ContestListResponse.builder()
                .id(contest.getId())
                .title(contest.getTitle())
                .status(computeRealTimeStatus(contest).name())
                .startTime(contest.getStartTime())
                .endTime(contest.getEndTime())
                .participantCount(participantRepository.countByIdContestId(contest.getId()))
                .maxParticipants(contest.getMaxParticipants() != null ? contest.getMaxParticipants() : 10)
                .serverTime(LocalDateTime.now())
                .isRegistered(isRegistered)
                .firstProblemId(firstProblemId)
                .creatorName(contest.getCreatedBy() != null ? contest.getCreatedBy().getFullName() : "N/A")
                .creatorUsername(contest.getCreatedBy() != null ? contest.getCreatedBy().getUsername() : "unknown")
                .build();
    }

    // =============================================
    // HELPER: Lấy danh sách Problems
    // =============================================
    /** Lấy danh sách Problems (không enrich - dùng cho isOwner và finished) */
    private List<ContestDetailResponse.ContestProblemResponse> getContestProblems(Integer contestId) {
        return getContestProblems(contestId, null);
    }

    /** Lấy danh sách Problems và enrich với submitCount/isAC của user */
    private List<ContestDetailResponse.ContestProblemResponse> getContestProblems(Integer contestId, Integer userId) {
        return problemRepository.findByIdContestIdOrderByOrderIndexAsc(contestId)
                .stream()
                .map(cp -> {
                    Integer submitCount = null;
                    Boolean isAC = null;
                    if (userId != null) {
                        submitCount = submissionRepository
                                .countByUserIdAndProblemIdAndContestIdAndIsTestRunFalse(userId, cp.getProblem().getId(),
                                        contestId);
                        isAC = submissionRepository
                                .existsByUserIdAndProblemIdAndContestIdAndIsTestRunFalseAndStatus(userId,
                                        cp.getProblem().getId(), contestId,
                                        com.codegym.spring_boot.entity.enums.SubmissionStatus.AC);
                    }
                    return ContestDetailResponse.ContestProblemResponse.builder()
                            .id(cp.getProblem().getId())
                            .orderIndex(cp.getOrderIndex())
                            .title(cp.getProblem().getTitle())
                            .difficulty(cp.getProblem().getDifficulty().name())
                            .isFrozen(Boolean.TRUE.equals(cp.getIsFrozen()))
                            .frozenReason(cp.getFrozenReason())
                            .submitCount(submitCount)
                            .isAC(isAC)
                            .maxScore(testCaseRepository.sumScoreWeightByProblemId(cp.getProblem().getId()))
                            .build();
                })
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

    // =============================================
    // HELPER: Unlock problems khi contest kết thúc/hủy
    // =============================================
    private void unlockProblemsOfContest(Integer contestId) {
        List<ContestProblem> contestProblems = problemRepository
                .findByIdContestIdOrderByOrderIndexAsc(contestId);

        for (ContestProblem cp : contestProblems) {
            Integer problemId = cp.getId().getProblemId();
            // Chỉ unlock nếu problem không còn trong contest nào khác ĐANG DIỄN RA hoặc SẮP DIỄN RA
            long activeContestCount = problemRepository.countActiveOrUpcomingByIdProblemId(problemId);
            if (activeContestCount <= 0) {
                iProblemRepository.findById(problemId).ifPresent(problem -> {
                    problem.setIsLocked(false);
                    iProblemRepository.save(problem);
                    log.info("Problem {} unlocked (contest {} ended/cancelled)", problemId, contestId);
                });
            }
        }
    }

    // =============================================
    // HELPER: Lock lại problems khi unfreeze contest
    // =============================================
    private void lockProblemsOfContest(Integer contestId) {
        List<ContestProblem> contestProblems = problemRepository
                .findByIdContestIdOrderByOrderIndexAsc(contestId);

        for (ContestProblem cp : contestProblems) {
            Integer problemId = cp.getId().getProblemId();
            iProblemRepository.findById(problemId).ifPresent(problem -> {
                problem.setIsLocked(true);
                iProblemRepository.save(problem);
                log.info("Problem {} locked (contest {} unfrozen)", problemId, contestId);
            });
        }
    }
}
