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
}
