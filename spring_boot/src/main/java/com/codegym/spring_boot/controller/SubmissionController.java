package com.codegym.spring_boot.controller;

import com.codegym.spring_boot.dto.SubmissionResultDTO;
import com.codegym.spring_boot.dto.SubmitRequestDTO;
import com.codegym.spring_boot.service.ISubmissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import com.codegym.spring_boot.dto.SubmissionHistoryDTO;
import java.util.List;
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

    @GetMapping("/me")
    public ResponseEntity<List<SubmissionHistoryDTO>> getMySubmissions(
            @RequestParam(name = "problemId") Integer problemId,
            @RequestParam(name = "contestId", required = false) Integer contestId) {
        List<SubmissionHistoryDTO> history = submissionService.getHistoryByProblem(problemId, contestId);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/{id}")
    public ResponseEntity<com.codegym.spring_boot.dto.SubmissionDetailDTO> getSubmissionDetail(
            @jakarta.websocket.server.PathParam("id") @org.springframework.web.bind.annotation.PathVariable("id") Integer id) {
        return ResponseEntity.ok(submissionService.getSubmissionDetail(id));
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
