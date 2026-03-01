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
    @Query("SELECT t FROM TestCase t WHERE t.problem.id = :problemId ORDER BY t.id DESC LIMIT 1")
    TestCase findLastTestCaseByProblemId(@Param("problemId") Integer problemId);
}
