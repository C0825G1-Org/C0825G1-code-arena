package com.codegym.spring_boot.repository;

import com.codegym.spring_boot.entity.Problem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface IProblemUserRepository extends JpaRepository<Problem, Integer>, JpaSpecificationExecutor<Problem> {
    
    @Query("SELECT COUNT(p) FROM Problem p WHERE " +
           "p.isDeleted = false " +
           "AND p.testcaseStatus = com.codegym.spring_boot.entity.enums.TestCaseStatus.ready")
    long countTotalActiveProblems();
}
