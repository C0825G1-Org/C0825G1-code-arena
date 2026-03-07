package com.codegym.spring_boot.service;

import com.codegym.spring_boot.dto.admin.AdminUserDTO;
import org.springframework.data.domain.Page;

public interface IAdminUserService {
    Page<AdminUserDTO> getUsers(String search, String role, int page, int size);
    void promoteToModerator(Integer userId);
    void demoteToUser(Integer userId);
    void toggleLock(Integer userId);
    void softDeleteUser(Integer userId);
    void hardDeleteUser(Integer userId);
}
