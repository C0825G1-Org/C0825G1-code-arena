package com.codegym.spring_boot.controller;

import com.codegym.spring_boot.dto.testcase.TestCaseRequestDTO;
import com.codegym.spring_boot.dto.testcase.TestCaseResponseDTO;
import com.codegym.spring_boot.dto.testcase.ZipUploadResponseDTO;
import com.codegym.spring_boot.service.ITestCaseService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/problems/{problemId}/testcases")
public class TestCaseController {

    private final ITestCaseService testCaseService;

    public TestCaseController(ITestCaseService testCaseService) {
        this.testCaseService = testCaseService;
    }

    @GetMapping
    public ResponseEntity<List<TestCaseResponseDTO>> getTestCasesByProblem(@PathVariable("problemId") Integer problemId) {
        return ResponseEntity.ok(testCaseService.getTestCasesByProblem(problemId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    public ResponseEntity<TestCaseResponseDTO> createTestCase(
            @PathVariable("problemId") Integer problemId,
            @Valid @RequestBody TestCaseRequestDTO requestDTO) {
        return new ResponseEntity<>(testCaseService.createTestCase(problemId, requestDTO), HttpStatus.CREATED);
    }

    @PutMapping("/{testCaseId}")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    public ResponseEntity<TestCaseResponseDTO> updateTestCase(
            @PathVariable("problemId") Integer problemId,
            @PathVariable("testCaseId") Integer testCaseId,
            @Valid @RequestBody TestCaseRequestDTO requestDTO) {
        return ResponseEntity.ok(testCaseService.updateTestCase(problemId, testCaseId, requestDTO));
    }

    @DeleteMapping("/{testCaseId}")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    public ResponseEntity<Void> deleteTestCase(
            @PathVariable("problemId") Integer problemId,
            @PathVariable("testCaseId") Integer testCaseId) {
        testCaseService.deleteTestCase(problemId, testCaseId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/zip")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    public ResponseEntity<ZipUploadResponseDTO> uploadTestCasesZip(
            @PathVariable("problemId") Integer problemId,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        return ResponseEntity.ok(testCaseService.uploadTestCasesZip(problemId, file));
    }
}
