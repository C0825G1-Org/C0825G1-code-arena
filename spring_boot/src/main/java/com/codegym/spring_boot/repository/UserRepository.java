package com.codegym.spring_boot.repository;

import com.codegym.spring_boot.entity.User;
import com.codegym.spring_boot.entity.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByUsernameAndIsDeletedFalse(String username);

    Optional<User> findByEmail(String email);

    Boolean existsByUsername(String username);

    Boolean existsByEmail(String email);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(u) FROM User u WHERE u.role = :role AND (u.globalRating > :rating OR (u.globalRating = :rating AND u.id < :userId))")
    long countGlobalRank(@org.springframework.data.repository.query.Param("role") UserRole role, 
                         @org.springframework.data.repository.query.Param("rating") int rating, 
                         @org.springframework.data.repository.query.Param("userId") int userId);

    List<User> findTop3ByRoleOrderByGlobalRatingDescIdAsc(UserRole role);

    Page<User> findByRoleAndEmailContainingIgnoreCaseOrRoleAndFullNameContainingIgnoreCase(
            UserRole role1, String email, UserRole role2, String fullName, Pageable pageable);
}
