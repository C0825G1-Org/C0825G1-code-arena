package com.codegym.spring_boot.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VerdictStatsDTO {
    private String name;   // e.g. "Accepted", "Wrong Answer", ...
    private long value;    // count
    private String color;  // hex color for chart
}
