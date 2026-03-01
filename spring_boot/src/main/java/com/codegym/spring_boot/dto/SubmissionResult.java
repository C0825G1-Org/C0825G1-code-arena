package com.codegym.spring_boot.dto;

import java.util.List;

public class SubmissionResult {

    private String status;              // ACCEPTED, WRONG_ANSWER, RUNTIME_ERROR...
    private String message;             // Thông tin bổ sung
    private List<TestCaseResult> testCases;

    private long executionTimeMs;       // Tổng thời gian chạy (ms)
    private long memoryUsedKb;          // Memory sử dụng (KB)

    // ===== Constructor rỗng =====
    public SubmissionResult() {
    }

    // ===== Constructor đầy đủ =====
    public SubmissionResult(
            String status,
            String message,
            List<TestCaseResult> testCases,
            long executionTimeMs,
            long memoryUsedKb
    ) {
        this.status = status;
        this.message = message;
        this.testCases = testCases;
        this.executionTimeMs = executionTimeMs;
        this.memoryUsedKb = memoryUsedKb;
    }

    // ===== Getter & Setter =====

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public List<TestCaseResult> getTestCases() {
        return testCases;
    }

    public long getExecutionTimeMs() {
        return executionTimeMs;
    }

    public long getMemoryUsedKb() {
        return memoryUsedKb;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public void setTestCases(List<TestCaseResult> testCases) {
        this.testCases = testCases;
    }

    public void setExecutionTimeMs(long executionTimeMs) {
        this.executionTimeMs = executionTimeMs;
    }

    public void setMemoryUsedKb(long memoryUsedKb) {
        this.memoryUsedKb = memoryUsedKb;
    }
}