package com.codegym.spring_boot.repository;

import com.codegym.spring_boot.entity.ProblemIOTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IProblemIOTemplateRepository extends JpaRepository<ProblemIOTemplate, Integer> {
    List<ProblemIOTemplate> findByProblemId(Integer problemId);
    void deleteByProblemId(Integer problemId);
}
