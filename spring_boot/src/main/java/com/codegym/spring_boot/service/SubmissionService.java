package com.codegym.spring_boot.service;

import com.codegym.spring_boot.dto.SubmissionRequest;
import com.codegym.spring_boot.dto.SubmissionResult;
import org.springframework.stereotype.Service;

@Service
public class SubmissionService {

    private final DockerJudgeService dockerJudgeService;

    public SubmissionService(DockerJudgeService dockerJudgeService) {
        this.dockerJudgeService = dockerJudgeService;
    }

    /**
     * Đồng bộ hóa với luồng của DockerJudgeService mới.
     * DockerJudgeService đã bao gồm logic tạo thư mục, lưu code và dọn dẹp.
     */
    public SubmissionResult handleSubmission(SubmissionRequest request) {
        // Gọi DockerJudgeService để chấm trực tiếp
        // Judge Engine mới tự quản lý vòng đời thư mục tạm và container
        return dockerJudgeService.judge(
                request.getLanguage(),
                request.getSourceCode(),
                request.getProblemId()
        );
    }
}