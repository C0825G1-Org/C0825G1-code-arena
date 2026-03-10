package com.codegym.spring_boot.repository;

import com.codegym.spring_boot.entity.Otp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OtpRepository extends JpaRepository<Otp, Long> {
    Optional<Otp> findTopByEmailAndUsedFalseOrderByExpiresAtDesc(String email);
}
