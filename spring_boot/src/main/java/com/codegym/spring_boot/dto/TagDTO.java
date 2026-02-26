package com.codegym.spring_boot.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TagDTO {
    private Integer id;

    @NotBlank(message = "Tên tag không được để trống")
    private String name;
}
