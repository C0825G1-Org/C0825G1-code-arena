package com.codegym.spring_boot.repository;

import com.codegym.spring_boot.entity.Problem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IProblemRepository extends JpaRepository<Problem, Integer> {
    Boolean existsBySlug(String slug);
    List<Problem> findAllByIsDeletedFalse();
    List<Problem> findAllByCreatedByAndIsDeletedFalse(com.codegym.spring_boot.entity.User user);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(p) FROM Problem p WHERE p.createdBy.id = :modId AND p.isDeleted = false AND p.testcaseStatus = 'not_uploaded'")
    long countPendingProblemsByCreator(@org.springframework.data.repository.query.Param("modId") Integer modId);

    long countByIsDeletedFalse();

    List<Problem> findByCreatedById(Integer createdById);
}
