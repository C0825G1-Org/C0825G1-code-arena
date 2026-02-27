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

    @Override
    public String getExpectedOutput(Integer testCaseId) {
        return testCaseRepository.findById(testCaseId).map(tc -> {
            if (Boolean.TRUE.equals(tc.getIsSample())) {
                return tc.getSampleOutput();
            }
            // TODO: Dev 2 sẽ viết logic đọc file .out từ ổ cứng (FS) thông qua
            // tc.getOutputFilename()
            return "MOCKED_HIDDEN_OUTPUT_WAITING_FOR_DEV2";
        }).orElseThrow(() -> new RuntimeException("Test case not found"));
    }
}
