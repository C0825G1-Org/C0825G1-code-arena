package com.codegym.spring_boot.scheduler;

import com.codegym.spring_boot.entity.ContestSnapshot;
import com.codegym.spring_boot.entity.SubscriptionPlan;
import com.codegym.spring_boot.repository.ContestSnapshotRepository;
import com.codegym.spring_boot.service.CloudinaryService;
import com.codegym.spring_boot.service.ISubscriptionService;
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
public class SnapshotCleanupScheduler {

    private final ContestSnapshotRepository snapshotRepository;
    private final ISubscriptionService subscriptionService;
    private final CloudinaryService cloudinaryService;

    /**
     * Chạy định kỳ vào 03:00 sáng mỗi ngày.
     * Quét các Snapshot đã quá hạn mức lưu trữ của Plan Chủ phòng (Host) để xóa khỏi Cloudinary và DB.
     */
    @Scheduled(cron = "0 0 3 * * ?")
    @Transactional
    public void cleanupExpiredSnapshots() {
        log.info("Starting cleanup job for expired snapshots...");
        
        List<ContestSnapshot> allSnapshots = snapshotRepository.findAll();
        LocalDateTime now = LocalDateTime.now();
        int deletedCount = 0;

        for (ContestSnapshot snapshot : allSnapshots) {
            if (snapshot.getContest() == null || snapshot.getContest().getCreatedBy() == null || snapshot.getCapturedAt() == null) {
                continue;
            }

            Integer hostId = snapshot.getContest().getCreatedBy().getId();
            SubscriptionPlan hostPlan = subscriptionService.getUserActivePlan(hostId);
            
            LocalDateTime expirationDate = snapshot.getCapturedAt().plusDays(hostPlan.getSnapshotRetentionDays());
            
            if (now.isAfter(expirationDate)) {
                try {
                    // Xóa ảnh trên Cloudinary
                    cloudinaryService.delete(snapshot.getFileName());
                    
                    // Xóa record trong DB
                    snapshotRepository.delete(snapshot);
                    deletedCount++;
                    
                    log.debug("Deleted snapshot ID {} (Expired according to plan {} - {} days)", 
                        snapshot.getId(), hostPlan.getName(), hostPlan.getSnapshotRetentionDays());
                } catch (Exception e) {
                    log.error("Failed to delete snapshot ID {}: {}", snapshot.getId(), e.getMessage());
                }
            }
        }
        
        log.info("Finished cleanup job for expired snapshots. Deleted {} records.", deletedCount);
    }
}
