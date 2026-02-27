package com.codegym.spring_boot.controller;

import com.codegym.spring_boot.dto.problem.ProblemRequestDTO;
import com.codegym.spring_boot.dto.problem.ProblemResponseDTO;
import com.codegym.spring_boot.entity.enums.Difficulty;
import com.codegym.spring_boot.service.IProblemService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/problems")
public class ProblemController {
    private final IProblemService problemService;

    public ProblemController(IProblemService problemService) {
        this.problemService = problemService;
    }

    @GetMapping
    public ResponseEntity<List<ProblemResponseDTO>> getAllProblems() {
        return ResponseEntity.ok(problemService.getAllProblems());
    }

    @GetMapping("/difficulties")
    public ResponseEntity<List<String>> getDifficulties() {
        return ResponseEntity.ok(Arrays.stream(Difficulty.values())
                .map(Enum::name)
                .collect(Collectors.toList()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProblemResponseDTO> getProblemById(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(problemService.getProblemById(id));
    }
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<ProblemResponseDTO> createProblem(@Valid @RequestBody ProblemRequestDTO requestDTO) {
        return new ResponseEntity<>(problemService.createProblem(requestDTO), HttpStatus.CREATED);
    }
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<ProblemResponseDTO> updateProblem(@PathVariable("id") Integer id, @Valid @RequestBody ProblemRequestDTO requestDTO) {
        return ResponseEntity.ok(problemService.updateProblem(id, requestDTO));
    }
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<Boolean> deleteProblem(@PathVariable("id") Integer id) {
        problemService.deleteProblem(id);
        return ResponseEntity.noContent().build();
    }
}
