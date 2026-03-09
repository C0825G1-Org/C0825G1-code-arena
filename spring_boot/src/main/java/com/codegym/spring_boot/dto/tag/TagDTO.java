package com.codegym.spring_boot.dto.tag;

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

    private Integer count; // Số lượng bài gán nhãn

    public TagDTO(Integer id, String name) {
        this.id = id;
        this.name = name;
        this.count = 0;
    }
}
