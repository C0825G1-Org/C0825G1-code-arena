package com.codegym.spring_boot.repository;

import com.codegym.spring_boot.entity.ContestSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContestSnapshotRepository extends JpaRepository<ContestSnapshot, Integer> {
    List<ContestSnapshot> findAllByContestIdAndUserId(Integer contestId, Integer userId);

    List<ContestSnapshot> findAllByCapturedAtBefore(java.time.LocalDateTime dateTime);
}
