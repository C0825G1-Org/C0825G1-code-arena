package com.codegym.spring_boot.repository;

import com.codegym.spring_boot.entity.UserSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, Integer> {
    
    List<UserSubscription> findByUserId(Integer userId);

    @Query("SELECT us FROM UserSubscription us " +
           "WHERE us.user.id = :userId " +
           "AND us.status = 'ACTIVE' " +
           "AND us.startDate <= :now " +
           "AND us.endDate > :now")
    Optional<UserSubscription> findActiveSubscriptionByUserId(Integer userId, LocalDateTime now);
}
