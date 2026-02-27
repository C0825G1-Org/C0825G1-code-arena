package com.codegym.spring_boot.service.judge;

import com.codegym.spring_boot.dto.JudgeResultMessage;
import com.codegym.spring_boot.entity.enums.SubmissionStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class JudgeCoreProcessor {

    private final OutputComparator outputComparator;

    /**
     * Phân loại lỗi và quyết định trạng thái cuối cùng của 1 Test Case
     * 
     * @param msg            JSON data từ Judge Engine
     * @param expectedOutput standard output lấy từ DB hoặc FS
     * @return Status cuối cùng của Test Case này
     */
    public ProcessedResult processTestCase(JudgeResultMessage msg, String expectedOutput) {

        // 1. Lọc lỗi phần cứng/giới hạn
        if (Boolean.TRUE.equals(msg.getIsTimeout())) {
            return new ProcessedResult(SubmissionStatus.TLE, "Time Limit Exceeded");
        }
        if (Boolean.TRUE.equals(msg.getIsOOM())) {
            return new ProcessedResult(SubmissionStatus.MLE, "Memory Limit Exceeded");
        }

        // 2. Lọc lỗi hệ thống hoặc Code
        if (msg.getExitCode() != null && msg.getExitCode() != 0) {
            // Nếu exitCode != 0, nghĩa là chương trình crash hoặc compile lỗi
            // Tạm quy ước: Nếu testCaseId là 0 (hoặc null tùy logic Dev3) thì là quá trình
            // dịch (CE)
            // Ngược lại là lỗi khi chạy (RE)
            if (msg.getTestCaseId() == null || msg.getTestCaseId() == 0) {
                return new ProcessedResult(SubmissionStatus.CE, msg.getStderr());
            } else {
                return new ProcessedResult(SubmissionStatus.RE, msg.getStderr());
            }
        }

        // 3. So khớp Output
        boolean isMatch = outputComparator.compare(msg.getStdout(), expectedOutput);

        if (isMatch) {
            return new ProcessedResult(SubmissionStatus.AC, null);
        } else {
            return new ProcessedResult(SubmissionStatus.WA, null);
        }
    }

    public record ProcessedResult(SubmissionStatus status, String errorMessage) {
    }
}
