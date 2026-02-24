package com.codegym.spring_boot.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Entity
@Table(name = "languages")
@Data
public class Language {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotBlank
    private String name;

    @Column(name = "compiler_option")
    private String compilerOption;

    @NotBlank
    @Column(name = "docker_image")
    private String dockerImage;

    @Column(name = "is_active")
    private Boolean isActive = true;
}
