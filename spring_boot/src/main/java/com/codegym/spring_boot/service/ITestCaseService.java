package com.codegym.spring_boot.service;

import com.codegym.spring_boot.dto.testcase.TestCaseRequestDTO;
import com.codegym.spring_boot.dto.testcase.TestCaseResponseDTO;
import com.codegym.spring_boot.dto.testcase.ZipUploadResponseDTO;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ITestCaseService {
    TestCaseResponseDTO createTestCase(Integer problemId, TestCaseRequestDTO requestDTO);
    TestCaseResponseDTO updateTestCase(Integer problemId, Integer testCaseId, TestCaseRequestDTO requestDTO);
    List<TestCaseResponseDTO> getTestCasesByProblem(Integer problemId);
    void deleteTestCase(Integer problemId, Integer testCaseId);
    ZipUploadResponseDTO uploadTestCasesZip(Integer problemId, MultipartFile file);
    /**
     * Lấy Standard Output chuẩn từ DB (nếu là sample test) hoặc đọc file (nếu là
     * hidden test).
     *
     * @param testCaseId ID của test case
     * @return Chuỗi kết quả chuẩn để so khớp
     */
    String getExpectedOutput(Integer testCaseId);
}
