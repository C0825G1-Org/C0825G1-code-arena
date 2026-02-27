package com.codegym.spring_boot.dto;

public class TestCaseResult {

    private int testCaseNumber;
    private boolean passed;
    private String message;

    public TestCaseResult(int testCaseNumber, boolean passed, String message) {
        this.testCaseNumber = testCaseNumber;
        this.passed = passed;
        this.message = message;
    }

    public int getTestCaseNumber() {
        return testCaseNumber;
    }

    public boolean isPassed() {
        return passed;
    }

    public String getMessage() {
        return message;
    }
}