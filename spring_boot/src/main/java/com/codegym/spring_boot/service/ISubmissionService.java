package com.codegym.spring_boot.service;

import com.codegym.spring_boot.dto.SubmissionResultDTO;
import com.codegym.spring_boot.dto.SubmitRequestDTO;

public interface ISubmissionService {
    Integer submitCode(SubmitRequestDTO submitRequestDTO);
    SubmissionResultDTO getSubmissionResult(Integer id);
}
