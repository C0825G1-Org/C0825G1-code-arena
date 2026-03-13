package com.codegym.spring_boot.service.impl;

import com.codegym.spring_boot.entity.SubscriptionPlan;
import com.codegym.spring_boot.entity.User;
import com.codegym.spring_boot.entity.UserSubscription;
import com.codegym.spring_boot.repository.SubscriptionPlanRepository;
import com.codegym.spring_boot.repository.UserRepository;
import com.codegym.spring_boot.repository.UserSubscriptionRepository;
import com.codegym.spring_boot.service.ISubscriptionService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionServiceImpl implements ISubscriptionService {

    private final SubscriptionPlanRepository planRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final UserRepository userRepository;

    @Override
    public List<SubscriptionPlan> getAllActivePlans() {
        return planRepository.findByIsActiveTrue();
    }

    @Override
    public SubscriptionPlan getUserActivePlan(Integer userId) {
        // Thay vì gọi userRepository chỉ đê check tồn tại thì có thể gộp luôn nếu cần
        // hoặc cứ giữ nguyên nhưng không gán biến nếu không dùng
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("Không tìm thấy người dùng với ID: " + userId);
        }

        // Lấy từ repository qua query 
        Optional<UserSubscription> activeSub = userSubscriptionRepository.findActiveSubscriptionByUserId(userId, LocalDateTime.now());
        
        if (activeSub.isPresent()) {
            return activeSub.get().getPlan();
        }

        // Nếu không có gói nào active, trả về cấu hình của gói Free
        SubscriptionPlan freePlan = planRepository.findByName("FREE");
        if (freePlan != null) {
            return freePlan;
        }

        // Fallback default cấu hình Free cứng (Trường hợp DB chưa có Free Plan)
        log.warn("Không tìm thấy gói FREE trong database. Trả về cấu hình mặc định (fallback).");
        return SubscriptionPlan.builder()
                .name("FREE")
                .price(BigDecimal.ZERO)
                .maxContestsPerMonth(2)
                .maxParticipantsPerContest(10)
                .snapshotRetentionDays(2)
                .isActive(true)
                .build();
    }

    @Override
    @Transactional
    @PostConstruct
    public void seedDefaultPlans() {
        if (planRepository.count() == 0) {
            log.info("Chưa có Subscription Plan nào trong DB, tiến hành tạo dữ liệu mẫu...");
            
            SubscriptionPlan freePlan = SubscriptionPlan.builder()
                    .name("FREE")
                    .price(BigDecimal.ZERO)
                    .maxContestsPerMonth(2)
                    .maxParticipantsPerContest(10)
                    .snapshotRetentionDays(2)
                    .isActive(true)
                    .build();

            SubscriptionPlan proPlan = SubscriptionPlan.builder()
                    .name("PRO")
                    .price(new BigDecimal("99000"))
                    .maxContestsPerMonth(20)
                    .maxParticipantsPerContest(100)
                    .snapshotRetentionDays(30)
                    .isActive(true)
                    .build();

            planRepository.saveAll(List.of(freePlan, proPlan));
            log.info("Tạo thành công dữ liệu mẫu cho FREE và PRO plan.");
        }
    }
}
