package com.codegym.spring_boot.task;

import com.codegym.spring_boot.entity.ContestSnapshot;
import com.codegym.spring_boot.repository.ContestSnapshotRepository;
import com.codegym.spring_boot.service.CloudinaryService;
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
public class SnapshotCleanupTask {

    private final ContestSnapshotRepository snapshotRepository;
    private final CloudinaryService cloudinaryService;

    // Chạy mỗi ngày 1 lần (vào lúc 00:00:00)
    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void cleanupOldSnapshots() {
        log.info("Bắt đầu dọn dẹp ảnh snapshot cũ trên Cloudinary...");

        // Tìm ảnh được chụp cách đây hơn 3 ngày (72 giờ)
        LocalDateTime threeDaysAgo = LocalDateTime.now().minusDays(3);
        List<ContestSnapshot> oldSnapshots = snapshotRepository.findAllByCapturedAtBefore(threeDaysAgo);

        if (oldSnapshots.isEmpty()) {
            log.info("Không có ảnh snapshot nào cần xóa.");
            return;
        }

        int deletedCount = 0;
        for (ContestSnapshot snapshot : oldSnapshots) {
            try {
                // Xóa trên Cloudinary (publicId lưu ở field fileName)
                cloudinaryService.delete(snapshot.getFileName());
                // Xóa trong Database
                snapshotRepository.delete(snapshot);
                deletedCount++;
            } catch (Exception e) {
                log.error("Lỗi khi xóa ảnh {} (publicId: {}): {}", snapshot.getId(), snapshot.getFileName(),
                        e.getMessage());
            }
        }

        log.info("Đã xóa xong {}/{} ảnh snapshot cũ.", deletedCount, oldSnapshots.size());
    }
}
