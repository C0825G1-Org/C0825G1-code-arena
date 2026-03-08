package com.codegym.spring_boot.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserDTO {
    private Integer id;
    private String username;
    private String fullName;
    private String email;
    private String role;        // "user" | "moderator" | "admin"
    private String createdAt;   // formatted dd/MM/yyyy
    private Boolean isLocked;
    private Boolean isDeleted;
}
