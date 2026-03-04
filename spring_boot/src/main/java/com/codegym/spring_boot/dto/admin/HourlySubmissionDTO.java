package com.codegym.spring_boot.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HourlySubmissionDTO {
    private String hour;   // e.g. "00h", "01h", ... "23h"
    private long total;
}
