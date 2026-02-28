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

    // Tìm TestCase cuối cùng được upload của một problem (theo ID mới nhất)
    TestCase findFirstByProblemIdOrderByIdDesc(Integer problemId);

    // Đếm số test case của 1 problem
    long countByProblemId(Integer problemId);
}
