package com.codegym.spring_boot.service.impl;

import com.codegym.spring_boot.dto.admin.AdminUserDTO;
import com.codegym.spring_boot.entity.User;
import com.codegym.spring_boot.entity.enums.UserRole;
import com.codegym.spring_boot.repository.UserRepository;
import com.codegym.spring_boot.service.IAdminUserService;
import com.corundumstudio.socketio.SocketIOServer;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class AdminUserService implements IAdminUserService {

    private final UserRepository userRepository;
    private final SocketIOServer socketIOServer;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @Override
    public Page<AdminUserDTO> getUsers(String search, String role, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        String keyword = (search == null) ? "" : search.trim();

        UserRole roleFilter = null;
        if (role != null && !role.isBlank()) {
            try {
                roleFilter = UserRole.valueOf(role.toLowerCase());
            } catch (IllegalArgumentException ignored) {}
        }

        Page<User> users = userRepository.searchUsers(keyword, roleFilter, pageable);
        return users.map(this::toDTO);
    }

    @Override
    @Transactional
    public void promoteToModerator(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        if (user.getRole() != UserRole.user) {
            throw new RuntimeException("Only users with role USER can be promoted to MODERATOR");
        }
        user.setRole(UserRole.moderator);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void demoteToUser(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        if (user.getRole() != UserRole.moderator) {
            throw new RuntimeException("Only MODERATOR accounts can be demoted to USER");
        }
        user.setRole(UserRole.user);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void toggleLock(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        if (user.getRole() == UserRole.admin) {
            throw new RuntimeException("Cannot lock an ADMIN account");
        }
        
        boolean newLockStatus = !Boolean.TRUE.equals(user.getIsLocked());
        user.setIsLocked(newLockStatus);
        userRepository.save(user);

        if (newLockStatus) {
            socketIOServer.getRoomOperations("user_" + userId).sendEvent("user_locked");
        }
    }

    private AdminUserDTO toDTO(User u) {
        return AdminUserDTO.builder()
                .id(u.getId())
                .username(u.getUsername())
                .fullName(u.getFullName())
                .email(u.getEmail())
                .role(u.getRole().name())
                .createdAt(u.getCreatedAt() != null ? u.getCreatedAt().format(DATE_FMT) : "—")
                .isLocked(Boolean.TRUE.equals(u.getIsLocked()))
                .build();
    }
}
