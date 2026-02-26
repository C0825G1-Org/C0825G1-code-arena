package com.codegym.spring_boot.service;

import com.codegym.spring_boot.dto.ProblemRequestDTO;
import com.codegym.spring_boot.dto.ProblemResponseDTO;

import java.util.List;

public interface IProblemService {
    List<ProblemResponseDTO> getAllProblems();
    ProblemResponseDTO getProblemById(Integer id);
    ProblemResponseDTO createProblem(ProblemRequestDTO requestDTO);
    ProblemResponseDTO updateProblem(Integer id, ProblemRequestDTO requestDTO);
    Boolean deleteProblem(Integer id);
}
