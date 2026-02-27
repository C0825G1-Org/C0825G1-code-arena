package com.codegym.spring_boot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JudgeResultMessage {
    private Long userId;
    private Long submissionId;
    private Long testCaseId; // Thêm id nhận biết test case cụ thể nào đang chấm
    private String status;
    private String stdout; // Data in ra màn hình
    private String stderr; // Data lỗi hệ thống/compling
    private Integer exitCode; // Kết quả trả về của shell script (0 là success)
    private Long executionTime;
    private Long memoryUsed;
    private Boolean isTimeout; // Cờ vượt quá thời gian
    private Boolean isOOM; // Cờ vượt quá bộ nhớ
    private Integer score;
}
