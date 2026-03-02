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
}
