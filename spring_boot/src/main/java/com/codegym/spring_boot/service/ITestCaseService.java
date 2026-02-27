package com.codegym.spring_boot.service;

public interface ITestCaseService {
    /**
     * Lấy Standard Output chuẩn từ DB (nếu là sample test) hoặc đọc file (nếu là
     * hidden test).
     * 
     * @param testCaseId ID của test case
     * @return Chuỗi kết quả chuẩn để so khớp
     */
    String getExpectedOutput(Integer testCaseId);
}
