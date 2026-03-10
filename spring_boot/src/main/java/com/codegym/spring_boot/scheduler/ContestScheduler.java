package com.codegym.spring_boot.scheduler;

import com.codegym.spring_boot.entity.Contest;
import com.codegym.spring_boot.entity.ContestProblem;
import com.codegym.spring_boot.entity.enums.ContestStatus;
import com.codegym.spring_boot.repository.ContestProblemRepository;
import com.codegym.spring_boot.repository.ContestRepository;
import com.codegym.spring_boot.repository.IProblemRepository;
import com.codegym.spring_boot.service.IRatingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ContestScheduler {

    private final ContestRepository contestRepository;
    private final ContestProblemRepository contestProblemRepository;
    private final IProblemRepository iProblemRepository;
    private final IRatingService ratingService;

    /**
     * Cron Job chạy mỗi 60 giây.
     * Quét DB để chuyển trạng thái Contest tự động:
     * - UPCOMING → ACTIVE (khi startTime đã qua)
     * - ACTIVE → FINISHED (khi endTime đã qua) + unlock problems + tính rating
     */
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void updateContestStatuses() {
        LocalDateTime now = LocalDateTime.now();

        // 1. UPCOMING → ACTIVE + lock problems
        List<Contest> toActivate = contestRepository
                .findByStatusAndStartTimeLessThanEqual(ContestStatus.upcoming, now);
        for (Contest contest : toActivate) {
            contest.setStatus(ContestStatus.active);
            log.info("Contest [{}] '{}' chuyển sang ACTIVE", contest.getId(), contest.getTitle());
            lockProblemsOfContest(contest.getId());
        }
        if (!toActivate.isEmpty()) {
            contestRepository.saveAll(toActivate);
        }

        // 2. ACTIVE → FINISHED + unlock problems + tính rating ELO
        List<Contest> toFinish = contestRepository
                .findByStatusAndEndTimeLessThanEqual(ContestStatus.active, now);
        for (Contest contest : toFinish) {
            contest.setStatus(ContestStatus.finished);
            log.info("Contest [{}] '{}' chuyển sang FINISHED", contest.getId(), contest.getTitle());
            unlockProblemsOfContest(contest.getId());

            // Tính toán và cập nhật ELO rating cho tất cả thí sinh
            try {
                ratingService.calculateAndApplyRatingChanges(contest.getId());
                log.info("Contest [{}]: Rating ELO đã được cập nhật thành công.", contest.getId());
            } catch (Exception e) {
                log.error("Contest [{}]: Lỗi khi tính rating ELO: {}", contest.getId(), e.getMessage(), e);
            }
        }
        if (!toFinish.isEmpty()) {
            contestRepository.saveAll(toFinish);
        }
    }

    /**
     * Hard Delete Scheduler — chạy lúc 2h sáng hằng ngày.
     * Xóa vĩnh viễn các contest đã bị CANCELLED quá 30 ngày.
     * updatedAt được dùng làm mốc thời gian "đã hủy".
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void hardDeleteExpiredContests() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(30);

        List<Contest> expiredContests = contestRepository
                .findByStatusAndUpdatedAtBefore(ContestStatus.cancelled, cutoff);

        if (expiredContests.isEmpty()) {
            return;
        }

        for (Contest contest : expiredContests) {
            // Xóa contest_problems trước (tránh FK constraint)
            contestProblemRepository.deleteByIdContestId(contest.getId());
            log.info("Hard delete: Contest [{}] '{}' (cancelled since {})",
                    contest.getId(), contest.getTitle(), contest.getUpdatedAt());
        }
        contestRepository.deleteAll(expiredContests);
        log.info("Hard delete: Đã xóa vĩnh viễn {} contest cancelled quá 30 ngày", expiredContests.size());
    }

    /**
     * Unlock tất cả problems của contest nếu chúng không còn
     * trong contest UPCOMING/ACTIVE nào khác.
     */
    private void unlockProblemsOfContest(Integer contestId) {
        List<ContestProblem> contestProblems = contestProblemRepository
                .findByIdContestIdOrderByOrderIndexAsc(contestId);

        for (ContestProblem cp : contestProblems) {
            Integer problemId = cp.getId().getProblemId();
            // Đếm bao nhiêu contest khác (không tính contest hiện tại) đang dùng problem này
            long otherContestCount = contestProblemRepository.countByIdProblemId(problemId) - 1;
            if (otherContestCount <= 0) {
                iProblemRepository.findById(problemId).ifPresent(problem -> {
                    problem.setIsLocked(false);
                    iProblemRepository.save(problem);
                    log.info("Problem {} unlocked (contest {} finished)", problemId, contestId);
                });
            }
        }
    }

    /**
     * Lock tất cả problems khi contest chuyển sang ACTIVE.
     */
    private void lockProblemsOfContest(Integer contestId) {
        List<ContestProblem> contestProblems = contestProblemRepository
                .findByIdContestIdOrderByOrderIndexAsc(contestId);

        for (ContestProblem cp : contestProblems) {
            Integer problemId = cp.getId().getProblemId();
            iProblemRepository.findById(problemId).ifPresent(problem -> {
                problem.setIsLocked(true);
                iProblemRepository.save(problem);
                log.info("Problem {} locked (contest {} activated)", problemId, contestId);
            });
        }
    }
}

