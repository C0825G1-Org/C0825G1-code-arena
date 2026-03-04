package com.codegym.spring_boot.repository;

import com.codegym.spring_boot.entity.Language;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LanguageRepository extends JpaRepository<Language, Integer> {
    long countByIsActiveTrue();
}
