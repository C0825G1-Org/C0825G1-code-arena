package com.codegym.spring_boot.repository;

import com.codegym.spring_boot.entity.User;
import com.codegym.spring_boot.entity.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByUsernameAndIsDeletedFalse(String username);

    Optional<User> findByEmail(String email);

    List<User> findByIsDeletedTrueAndUpdatedAtBefore(java.time.LocalDateTime cutoff);

    Boolean existsByUsername(String username);

    Boolean existsByEmail(String email);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role AND (u.globalRating > :rating OR (u.globalRating = :rating AND u.id < :userId))")
    long countGlobalRank(@Param("role") UserRole role,
                         @Param("rating") int rating,
                         @Param("userId") int userId);

    List<User> findTop3ByRoleOrderByGlobalRatingDescIdAsc(UserRole role);

    Page<User> findByRoleAndEmailContainingIgnoreCaseOrRoleAndFullNameContainingIgnoreCase(
            UserRole role1, String email, UserRole role2, String fullName, Pageable pageable);

    @Query("""
        SELECT u FROM User u
        WHERE (:role IS NULL OR u.role = :role)
          AND (:keyword = '' OR LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')))
        """)
    Page<User> searchUsers(@Param("keyword") String keyword,
                           @Param("role") UserRole role,
                           Pageable pageable);
}
