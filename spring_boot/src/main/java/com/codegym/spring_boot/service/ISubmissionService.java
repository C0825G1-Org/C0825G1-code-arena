package com.codegym.spring_boot.service;

import com.codegym.spring_boot.dto.JudgeResultMessage;
import com.codegym.spring_boot.dto.SubmitRequestDTO;
import com.codegym.spring_boot.dto.SubmissionDetailDTO;
import java.util.List;

public interface ISubmissionService {
    Integer submitCode(SubmitRequestDTO submitRequestDTO);

    void processJudgeResult(JudgeResultMessage msg);

    List<com.codegym.spring_boot.dto.SubmissionHistoryDTO> getHistoryByProblem(Integer problemId,
            Integer contestId);

    SubmissionDetailDTO getSubmissionDetail(Integer submissionId);
}
