package com.codegym.spring_boot.scheduler;

import com.codegym.spring_boot.entity.Contest;
import com.codegym.spring_boot.entity.ContestProblem;
import com.codegym.spring_boot.entity.enums.ContestStatus;
import com.codegym.spring_boot.repository.ContestProblemRepository;
import com.codegym.spring_boot.repository.ContestRepository;
import com.codegym.spring_boot.repository.IProblemRepository;
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

    /**
     * Cron Job chạy mỗi 60 giây.
     * Quét DB để chuyển trạng thái Contest tự động:
     * - UPCOMING → ACTIVE (khi startTime đã qua)
     * - ACTIVE → FINISHED (khi endTime đã qua) + unlock problems
     */
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void updateContestStatuses() {
        LocalDateTime now = LocalDateTime.now();

        // 1. UPCOMING → ACTIVE
        List<Contest> toActivate = contestRepository
                .findByStatusAndStartTimeLessThanEqual(ContestStatus.upcoming, now);
        for (Contest contest : toActivate) {
            contest.setStatus(ContestStatus.active);
            log.info("Contest [{}] '{}' chuyển sang ACTIVE", contest.getId(), contest.getTitle());
        }
        if (!toActivate.isEmpty()) {
            contestRepository.saveAll(toActivate);
        }

        // 2. ACTIVE → FINISHED + unlock problems
        List<Contest> toFinish = contestRepository
                .findByStatusAndEndTimeLessThanEqual(ContestStatus.active, now);
        for (Contest contest : toFinish) {
            contest.setStatus(ContestStatus.finished);
            log.info("Contest [{}] '{}' chuyển sang FINISHED", contest.getId(), contest.getTitle());
            unlockProblemsOfContest(contest.getId());
        }
        if (!toFinish.isEmpty()) {
            contestRepository.saveAll(toFinish);
        }
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
}

