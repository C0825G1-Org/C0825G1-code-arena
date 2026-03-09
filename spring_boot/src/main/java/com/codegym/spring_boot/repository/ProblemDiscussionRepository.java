package com.codegym.spring_boot.repository;

import com.codegym.spring_boot.entity.ProblemDiscussion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProblemDiscussionRepository extends JpaRepository<ProblemDiscussion, Integer> {
    Page<ProblemDiscussion> findByProblemIdOrderByCreatedAtDesc(Integer problemId, Pageable pageable);

    Page<ProblemDiscussion> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
