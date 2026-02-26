package com.codegym.spring_boot.controller;

import com.codegym.spring_boot.dto.SubmitRequestDTO;
import com.codegym.spring_boot.service.ISubmissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/submissions")
@RequiredArgsConstructor
public class SubmissionController {

    private final ISubmissionService submissionService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> submitCode(@Valid @RequestBody SubmitRequestDTO requestDTO) {
        Integer submissionId = submissionService.submitCode(requestDTO);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Đã nhận bài nộp thành công.");
        response.put("submissionId", submissionId);

        return ResponseEntity.ok(response);
    }
}
