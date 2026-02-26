package com.codegym.spring_boot.scheduler;

import com.codegym.spring_boot.entity.Contest;
import com.codegym.spring_boot.entity.enums.ContestStatus;
import com.codegym.spring_boot.repository.ContestRepository;
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

    /**
     * Cron Job chạy mỗi 60 giây.
     * Quét DB để chuyển trạng thái Contest tự động:
     * - UPCOMING → ACTIVE (khi startTime đã qua)
     * - ACTIVE → FINISHED (khi endTime đã qua)
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

        // 2. ACTIVE → FINISHED
        List<Contest> toFinish = contestRepository
                .findByStatusAndEndTimeLessThanEqual(ContestStatus.active, now);
        for (Contest contest : toFinish) {
            contest.setStatus(ContestStatus.finished);
            log.info("Contest [{}] '{}' chuyển sang FINISHED", contest.getId(), contest.getTitle());
        }
        if (!toFinish.isEmpty()) {
            contestRepository.saveAll(toFinish);
        }
    }
}
