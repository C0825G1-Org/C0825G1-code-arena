package com.codegym.spring_boot.repository;

import com.codegym.spring_boot.entity.SubmissionTestResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface ISubmissionTestResultRepository extends JpaRepository<SubmissionTestResult, Integer> {
    List<SubmissionTestResult> findBySubmissionId(Integer submissionId);

    long countBySubmissionId(Integer submissionId);

    @Modifying
    @Transactional
    @Query("DELETE FROM SubmissionTestResult str WHERE str.testCase.problem.id = :problemId")
    void deleteByProblemId(@Param("problemId") Integer problemId);
}
