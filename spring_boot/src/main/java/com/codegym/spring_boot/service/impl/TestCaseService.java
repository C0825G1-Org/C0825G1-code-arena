package com.codegym.spring_boot.service.impl;

import com.codegym.spring_boot.repository.ITestCaseRepository;
import com.codegym.spring_boot.service.ITestCaseService;
import org.springframework.stereotype.Service;

@Service
public class TestCaseService implements ITestCaseService {
    private final ITestCaseRepository testCaseRepository;

    public TestCaseService(ITestCaseRepository testCaseRepository) {
        this.testCaseRepository = testCaseRepository;
    }
}
