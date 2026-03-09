package com.codegym.spring_boot.repository;

import com.codegym.spring_boot.entity.Profile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProfileRepository extends JpaRepository<Profile, Integer> {
}
