package com.codegym.spring_boot.repository;

import com.codegym.spring_boot.entity.ContestParticipant;
import com.codegym.spring_boot.entity.ContestParticipantId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface ContestParticipantRepository extends JpaRepository<ContestParticipant, ContestParticipantId> {
        Optional<ContestParticipant> findByContestIdAndUserId(Integer contestId, Integer userId);

        // API lấy lịch sử cuộc thi tham gia cho Profile Dashboard
        @Query("SELECT cp FROM ContestParticipant cp JOIN FETCH cp.contest WHERE cp.id.userId = :userId ORDER BY cp.contest.startTime DESC")
        List<ContestParticipant> findRecentContestsByUserId(@Param("userId") Integer userId, Pageable pageable);

        // Đếm số người đăng ký một cuộc thi
        long countByIdContestId(Integer contestId);

        // Đếm số người ĐÃ thực sự vào màn hình làm bài của cuộc thi đang diễn ra
        long countByContestIdAndHasJoinedActiveTrue(Integer contestId);

        // Lấy bảng xếp hạng: sắp theo điểm giảm dần, penalty tăng dần
        List<ContestParticipant> findByIdContestIdOrderByTotalScoreDescTotalPenaltyAsc(Integer contestId);

        // Lấy danh sách user đã đăng ký một cuộc thi
        List<ContestParticipant> findByIdContestId(Integer contestId);

        // Bảng xếp hạng phân trang cho Monitor
        Page<ContestParticipant> findByIdContestIdOrderByTotalScoreDescTotalPenaltyAsc(Integer contestId,
                        Pageable pageable);

        @Query("SELECT cp FROM ContestParticipant cp JOIN FETCH cp.user WHERE cp.contest.id = :contestId ORDER BY cp.totalScore DESC, cp.totalPenalty ASC")
        List<ContestParticipant> findAllWithUserByContestId(@Param("contestId") Integer contestId);

        @Query("SELECT COUNT(cp) FROM ContestParticipant cp WHERE cp.contest.createdBy.id = :modId")
        long countTotalParticipantsByModId(@Param("modId") Integer modId);

        @org.springframework.data.jpa.repository.Modifying
        @org.springframework.data.jpa.repository.Query("UPDATE ContestParticipant cp SET " +
                        "cp.violationCount = cp.violationCount + 1, " +
                        "cp.hasScorePenalty = (CASE WHEN (cp.violationCount + 1) >= 2 THEN true ELSE cp.hasScorePenalty END), "
                        +
                        "cp.totalPenalty = (CASE WHEN (cp.violationCount + 1) = 2 THEN cp.totalPenalty + 1000 ELSE cp.totalPenalty END), "
                        +
                        "cp.status = (CASE WHEN (cp.violationCount + 1) >= 3 THEN com.codegym.spring_boot.entity.enums.ParticipantStatus.DISQUALIFIED ELSE cp.status END) "
                        +
                        "WHERE cp.id.contestId = :contestId AND cp.id.userId = :userId AND cp.status = com.codegym.spring_boot.entity.enums.ParticipantStatus.JOINED")
        void incrementViolationCount(@Param("contestId") Integer contestId, @Param("userId") Integer userId);

        void deleteAllByUserId(Integer userId);
}
