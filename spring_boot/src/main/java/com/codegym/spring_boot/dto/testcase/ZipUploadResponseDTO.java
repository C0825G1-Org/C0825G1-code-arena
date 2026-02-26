package com.codegym.spring_boot.dto.testcase;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ZipUploadResponseDTO {
    private int successCount;
    private int skipCount;
    private List<String> errorMessages;
}
