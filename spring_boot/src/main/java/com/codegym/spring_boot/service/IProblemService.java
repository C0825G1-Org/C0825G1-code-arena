package com.codegym.spring_boot.service;

import com.codegym.spring_boot.dto.problem.ProblemRequestDTO;
import com.codegym.spring_boot.dto.problem.ProblemResponseDTO;

import java.util.List;

public interface IProblemService {
    List<ProblemResponseDTO> getAllProblems(Boolean manage);
    ProblemResponseDTO getProblemById(Integer id);
    ProblemResponseDTO getProblemBySlug(String slug);
    ProblemResponseDTO createProblem(ProblemRequestDTO requestDTO);
    ProblemResponseDTO updateProblem(Integer id, ProblemRequestDTO requestDTO);
    Boolean deleteProblem(Integer id);
    Boolean restoreProblem(Integer id);
}
