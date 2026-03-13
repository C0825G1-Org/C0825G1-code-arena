package com.codegym.spring_boot.repository;

import com.codegym.spring_boot.entity.TestCase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ITestCaseRepository extends JpaRepository<TestCase, Integer> {
    List<TestCase> findByProblemId(Integer problemId);

    TestCase findByProblemIdAndInputFilename(Integer problemId, String inputFilename);

    // Tìm TestCase cuối cùng được upload của một problem (theo ID mới nhất)
    TestCase findFirstByProblemIdOrderByIdDesc(Integer problemId);

    // Đếm số test case của 1 problem
    long countByProblemId(Integer problemId);

    // Tính tổng scoreWeight của tất cả test case thuộc 1 problem (dùng cho
    // maxScore)
    @Query("SELECT COALESCE(SUM(COALESCE(t.scoreWeight, 1)), 0) FROM TestCase t WHERE t.problem.id = :problemId")
    int sumScoreWeightByProblemId(@Param("problemId") Integer problemId);

    void deleteByProblemId(Integer problemId);
}
