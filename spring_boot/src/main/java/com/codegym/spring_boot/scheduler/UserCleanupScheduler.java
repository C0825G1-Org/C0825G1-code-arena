package com.codegym.spring_boot.scheduler;

import com.codegym.spring_boot.entity.User;
import com.codegym.spring_boot.repository.UserRepository;
import com.codegym.spring_boot.service.IAdminUserService;
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
public class UserCleanupScheduler {

    private final UserRepository userRepository;
    private final IAdminUserService adminUserService;

    /**
     * Chạy định kỳ vào 02:00 sáng mỗi ngày.
     * Tìm các user đã đánh dấu `isDeleted = true` quá 30 ngày để xoá cứng (hard delete).
     */
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void cleanupDeletedUsers() {
        log.info("Starting cleanup job for soft-deleted users...");
        
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(30);
        List<User> usersToDelete = userRepository.findByIsDeletedTrueAndUpdatedAtBefore(cutoffDate);

        if (usersToDelete.isEmpty()) {
            log.info("No soft-deleted users found older than 30 days.");
            return;
        }

        log.info("Found {} soft-deleted users to permanently remove.", usersToDelete.size());

        for (User user : usersToDelete) {
            try {
                // Sử dụng hàm xoá cứng ở service để cascade Reassign Problems/Contests và Delete Submissions
                adminUserService.hardDeleteUser(user.getId());
                log.info("Successfully hard-deleted user ID: {}", user.getId());
            } catch (Exception e) {
                log.error("Failed to hard-delete user ID: {}. Error: {}", user.getId(), e.getMessage(), e);
            }
        }
        
        log.info("Finished cleanup job for soft-deleted users.");
    }
}
