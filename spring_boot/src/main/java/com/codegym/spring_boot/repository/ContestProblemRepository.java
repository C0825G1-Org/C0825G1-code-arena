package com.codegym.spring_boot.repository;

import com.codegym.spring_boot.entity.ContestProblem;
import com.codegym.spring_boot.entity.ContestProblemId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContestProblemRepository extends JpaRepository<ContestProblem, ContestProblemId> {

    // Lấy danh sách bài tập của contest, sắp theo thứ tự
    List<ContestProblem> findByIdContestIdOrderByOrderIndexAsc(Integer contestId);

    // Lấy danh sách các cuộc thi mà một bài tập đang tham gia
    List<ContestProblem> findByIdProblemId(Integer problemId);

    // Xóa tất cả bài tập của contest (dùng khi reset)
    void deleteByIdContestId(Integer contestId);

    // Đếm số contest đang dùng problem này (dùng cho unlock logic)
    long countByIdProblemId(Integer problemId);

    // Đếm tổng số bài tập đang có trong một cuộc thi
    long countByIdContestId(Integer contestId);

    // Đếm số contest đang ACTIVE hoặc UPCOMING mà bài tập này tham gia
    @org.springframework.data.jpa.repository.Query("SELECT COUNT(cp) FROM ContestProblem cp WHERE cp.id.problemId = :problemId AND cp.contest.status IN (com.codegym.spring_boot.entity.enums.ContestStatus.active, com.codegym.spring_boot.entity.enums.ContestStatus.upcoming)")
    long countActiveOrUpcomingByIdProblemId(@org.springframework.data.repository.query.Param("problemId") Integer problemId);
}
