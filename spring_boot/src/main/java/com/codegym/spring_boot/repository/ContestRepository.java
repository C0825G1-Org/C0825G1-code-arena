package com.codegym.spring_boot.repository;

import com.codegym.spring_boot.entity.Contest;
import com.codegym.spring_boot.entity.enums.ContestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ContestRepository extends JpaRepository<Contest, Integer>, JpaSpecificationExecutor<Contest> {

    // Lấy danh sách contest không bị CANCELLED (cho User thường)
    Page<Contest> findByStatusNot(ContestStatus status, Pageable pageable);

    // Của riêng Admin/Moderator (cho màn hình quản lý)
    Page<Contest> findByCreatedById(Integer createdById, Pageable pageable);
    Page<Contest> findByCreatedByIdAndStatus(Integer createdById, ContestStatus status, Pageable pageable);

    // Lọc theo status cụ thể
    Page<Contest> findByStatus(ContestStatus status, Pageable pageable);
    
    // Lấy tất cả theo status không phân trang (cho Scheduler)
    List<Contest> findByStatus(ContestStatus status);

    // Cho Cron Job: tìm contest UPCOMING mà startTime đã qua
    List<Contest> findByStatusAndStartTimeLessThanEqual(ContestStatus status, LocalDateTime time);

    // Cho Cron Job: tìm contest ACTIVE mà endTime đã qua
    List<Contest> findByStatusAndEndTimeLessThanEqual(ContestStatus status, LocalDateTime time);

    // Cho Hard Delete Scheduler: tìm contest CANCELLED quá hạn
    List<Contest> findByStatusAndUpdatedAtBefore(ContestStatus status, LocalDateTime cutoffTime);

    long countByCreatedById(Integer createdById);
    
    // Đếm số lượng cuộc thi đã tạo từ thời điểm cho trước (Dùng cho check Plan Quota)
    long countByCreatedByIdAndCreatedAtAfter(Integer createdById, LocalDateTime createdAt);

    // Admin Dashboard: contest đang active hoặc upcoming chưa bắt đầu hôm nay
    @Query(
        "SELECT c FROM Contest c WHERE c.status = 'active' "
        + "OR (c.status = 'upcoming' AND c.startTime >= :startOfDay AND c.startTime < :endOfDay) "
        + "ORDER BY c.startTime ASC")
    List<Contest> findActiveAndUpcomingToday(
        @Param("startOfDay") LocalDateTime startOfDay,
        @Param("endOfDay") LocalDateTime endOfDay);
}
