package com.codegym.spring_boot.repository;

import com.codegym.spring_boot.entity.FavoriteProblem;
import com.codegym.spring_boot.entity.Problem;
import com.codegym.spring_boot.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteProblemRepository extends JpaRepository<FavoriteProblem, Integer> {
    
    // Tìm kiếm list các ID thay cho entity nếu cân tối ưu (nhưng tạm thời cần List Problem)
    List<FavoriteProblem> findByUserOrderByCreatedAtDesc(User user);
    
    Page<FavoriteProblem> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    Optional<FavoriteProblem> findByUserAndProblem(User user, Problem problem);


    boolean existsByUserAndProblem(User user, Problem problem);

    @Modifying
    @Transactional
    @Query("DELETE FROM FavoriteProblem fp WHERE fp.problem.id = :problemId")
    void deleteAllByProblemId(@Param("problemId") Integer problemId);
    
    // Tuỳ chọn: tối ưu lấy danh sách ID problem user đã like (để hiển thị trạng thái nút thích trên danh sách Problem)
    // Thực thi query này bằng jpql nếu cần
    // @Query("SELECT fp.problem.id FROM FavoriteProblem fp WHERE fp.user.id = :userId")
    // List<Integer> findProblemIdsByUserId(@Param("userId") Integer userId);
}
