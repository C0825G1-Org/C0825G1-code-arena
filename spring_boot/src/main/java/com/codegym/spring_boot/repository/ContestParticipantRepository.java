package com.codegym.spring_boot.repository;

import com.codegym.spring_boot.entity.ContestParticipant;
import com.codegym.spring_boot.entity.ContestParticipantId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ContestParticipantRepository extends JpaRepository<ContestParticipant, ContestParticipantId> {
    Optional<ContestParticipant> findByContestIdAndUserId(Integer contestId, Integer userId);
}
