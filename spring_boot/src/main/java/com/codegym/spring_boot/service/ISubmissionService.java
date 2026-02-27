package com.codegym.spring_boot.service;

import com.codegym.spring_boot.dto.JudgeResultMessage;
import com.codegym.spring_boot.dto.SubmitRequestDTO;

public interface ISubmissionService {
    Integer submitCode(SubmitRequestDTO submitRequestDTO);

    void processJudgeResult(JudgeResultMessage msg);

    java.util.List<com.codegym.spring_boot.dto.SubmissionHistoryDTO> getHistoryByProblem(Integer problemId,
            Integer contestId);
}
