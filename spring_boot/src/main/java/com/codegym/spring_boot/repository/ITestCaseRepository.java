package com.codegym.spring_boot.repository;

import com.codegym.spring_boot.entity.TestCase;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ITestCaseRepository extends JpaRepository<TestCase, Integer> {
}
