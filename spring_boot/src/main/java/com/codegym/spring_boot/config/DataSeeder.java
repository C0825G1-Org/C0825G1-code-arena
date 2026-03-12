package com.codegym.spring_boot.config;

import com.codegym.spring_boot.entity.SubscriptionPlan;
import com.codegym.spring_boot.repository.SubscriptionPlanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final SubscriptionPlanRepository planRepository;

    @Override
    public void run(String... args) {
        log.info("Đang đồng bộ cấu hình gói cước...");
        upsertPlan("FREE", BigDecimal.ZERO, 2, 10, 2);
        upsertPlan("PRO", new BigDecimal("99000"), 20, 100, 30);
        log.info("Đồng bộ cấu hình gói cước hoàn tất.");
    }

    private void upsertPlan(String name, BigDecimal price, int maxContests, int maxParticipants, int retentionDays) {
        SubscriptionPlan plan = planRepository.findByName(name);
        if (plan == null) {
            plan = SubscriptionPlan.builder()
                    .name(name)
                    .price(price)
                    .maxContestsPerMonth(maxContests)
                    .maxParticipantsPerContest(maxParticipants)
                    .snapshotRetentionDays(retentionDays)
                    .isActive(true)
                    .build();
            log.info("Tạo gói [{}] mới.", name);
        } else {
            plan.setMaxContestsPerMonth(maxContests);
            plan.setMaxParticipantsPerContest(maxParticipants);
            plan.setSnapshotRetentionDays(retentionDays);
            plan.setIsActive(true);
            log.info("Cập nhật gói [{}]: maxContests={}, maxParticipants={}.", name, maxContests, maxParticipants);
        }
        planRepository.save(plan);
    }
}
