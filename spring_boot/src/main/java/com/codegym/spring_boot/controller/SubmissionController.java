package com.codegym.spring_boot.controller;

import com.codegym.spring_boot.dto.SubmissionResultDTO;
import com.codegym.spring_boot.dto.SubmitRequestDTO;
import com.codegym.spring_boot.service.ISubmissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping({"/api/submissions", "/api/submissions/"})
@RequiredArgsConstructor
@CrossOrigin("*")
public class SubmissionController {

    private final ISubmissionService submissionService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> submitCode(@Valid @RequestBody SubmitRequestDTO requestDTO) {
        log.info("Received submission request for problem: {}", requestDTO.getProblemId());
        Integer submissionId = submissionService.submitCode(requestDTO);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Đã nhận bài nộp thành công.");
        response.put("submissionId", submissionId);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/test")
    public ResponseEntity<String> test() {
        log.info("Test endpoint called!");
        return ResponseEntity.ok("Submission Controller is ACTIVE");
    }

    @GetMapping("/{id}")
    public ResponseEntity<SubmissionResultDTO> getSubmissionStatus(@PathVariable Integer id) {
        log.info("Retrieving status for submission: {}", id);
        SubmissionResultDTO result = submissionService.getSubmissionResult(id);
        return ResponseEntity.ok(result);
    }




}
