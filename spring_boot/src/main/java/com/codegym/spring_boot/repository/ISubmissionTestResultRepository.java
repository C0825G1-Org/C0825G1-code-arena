package com.codegym.spring_boot.repository;

import com.codegym.spring_boot.entity.SubmissionTestResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ISubmissionTestResultRepository extends JpaRepository<SubmissionTestResult, Integer> {
    List<SubmissionTestResult> findBySubmissionId(Integer submissionId);

    long countBySubmissionId(Integer submissionId);
}
