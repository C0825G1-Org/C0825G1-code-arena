package com.codegym.spring_boot.repository;

import com.codegym.spring_boot.entity.Submission;
import com.codegym.spring_boot.entity.enums.SubmissionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Optional;
import com.codegym.spring_boot.entity.enums.TestCaseStatus;

import java.util.List;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Integer> {

    @Query("SELECT s FROM Submission s JOIN FETCH s.language JOIN FETCH s.problem JOIN FETCH s.user WHERE s.id = :id")
    Optional<Submission> findByIdWithAssociations(@Param("id") Integer id);

    // List submissions for practice mode (outside contest)
    List<Submission> findByUserIdAndProblemIdAndContestIsNullOrderByIdDesc(Integer userId, Integer problemId);

    // List submissions for contest mode
    List<Submission> findByUserIdAndProblemIdAndContestIdOrderByIdDesc(Integer userId, Integer problemId,
            Integer contestId);

    // Kiem tra thu da bao gio user AC bai nay trong ky thi nay chua
    boolean existsByUserIdAndProblemIdAndContestIdAndStatus(Integer userId, Integer problemId, Integer contestId,
            SubmissionStatus status);

    // Đếm số lần Failed (Status NOT AC) trước cái Submission ID hiện tại của kỳ thi
    // đó
    int countByUserIdAndProblemIdAndContestIdAndIdLessThanAndStatusNot(Integer userId, Integer problemId,
            Integer contestId, Integer id, SubmissionStatus status);

    // Đếm số lần nộp lỗi thực sự (WA, TLE, MLE, RE) để tính Penalty ICPC (không
    // tính CE)
    int countByUserIdAndProblemIdAndContestIdAndIdLessThanAndStatusIn(Integer userId, Integer problemId,
            Integer contestId, Integer id, java.util.Collection<SubmissionStatus> statuses);

    // Fetch all submissions for a contest to rebuild leaderboard details
    List<Submission> findByContestIdOrderByIdAsc(Integer contestId);

    // Count distinctly solved problems by user
    @Query("SELECT COUNT(DISTINCT s.problem.id) FROM Submission s WHERE s.user.id = :userId AND s.status = :status AND s.problem.isDeleted = false AND s.problem.testcaseStatus = com.codegym.spring_boot.entity.enums.TestCaseStatus.ready")
    long countDistinctProblemByUserIdAndStatus(@Param("userId") Integer userId, @Param("status") SubmissionStatus status);

    @Query("SELECT DISTINCT s.problem.id FROM Submission s WHERE s.user.id = :userId AND s.status = :status AND s.problem.id IN :problemIds")
    List<Integer> findSolvedProblemIdsByUserIdAndProblemIds(@Param("userId") Integer userId, @Param("status") SubmissionStatus status, @Param("problemIds") Collection<Integer> problemIds);

    @Query("SELECT DISTINCT s.problem.id FROM Submission s WHERE s.user.id = :userId AND s.problem.id IN :problemIds")
    List<Integer> findAttemptedProblemIdsByUserIdAndProblemIds(@Param("userId") Integer userId, @Param("problemIds") Collection<Integer> problemIds);
}
