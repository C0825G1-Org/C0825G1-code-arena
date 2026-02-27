package com.codegym.spring_boot.repository;

import com.codegym.spring_boot.entity.ContestClarification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ContestClarificationRepository extends JpaRepository<ContestClarification, Integer> {

    // Moderator: xem tất cả clarifications của contest
    List<ContestClarification> findByContestIdOrderByCreatedAtDesc(Integer contestId);

    // Thí sinh: xem clarifications của mình + public clarifications
    List<ContestClarification> findByContestIdAndUserIdOrContestIdAndIsPublicTrueOrderByCreatedAtDesc(
            Integer contestId1, Integer userId, Integer contestId2);
}
