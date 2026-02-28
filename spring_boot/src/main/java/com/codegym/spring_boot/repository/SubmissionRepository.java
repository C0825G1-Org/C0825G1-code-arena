package com.codegym.spring_boot.repository;

import com.codegym.spring_boot.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Integer> {
    
    @Query("SELECT s FROM Submission s JOIN FETCH s.language JOIN FETCH s.problem JOIN FETCH s.user WHERE s.id = :id")
    Optional<Submission> findByIdWithAssociations(@Param("id") Integer id);
}
