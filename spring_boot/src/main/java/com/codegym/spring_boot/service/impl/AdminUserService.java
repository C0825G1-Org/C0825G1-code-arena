package com.codegym.spring_boot.service.impl;

import com.codegym.spring_boot.dto.admin.AdminUserDTO;
import com.codegym.spring_boot.entity.User;
import com.codegym.spring_boot.repository.IProblemRepository;
import com.codegym.spring_boot.repository.ContestRepository;
import com.codegym.spring_boot.repository.SubmissionRepository;
import com.codegym.spring_boot.repository.ContestParticipantRepository;
import com.codegym.spring_boot.repository.ContestClarificationRepository;
import com.codegym.spring_boot.entity.Problem;
import com.codegym.spring_boot.entity.Contest;
import com.codegym.spring_boot.entity.ContestClarification;
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
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminUserService implements IAdminUserService {

    private final UserRepository userRepository;
    private final SocketIOServer socketIOServer;
    private final IProblemRepository problemRepository;
    private final ContestRepository contestRepository;
    private final SubmissionRepository submissionRepository;
    private final ContestParticipantRepository contestParticipantRepository;
    private final ContestClarificationRepository contestClarificationRepository;

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

    @Override
    @Transactional
    public void softDeleteUser(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        
        if (user.getRole() == UserRole.admin) {
            throw new RuntimeException("Cannot delete an ADMIN account");
        }
        
        user.setIsDeleted(true);
        userRepository.save(user);
        
        // Cập nhật socket để kick user
        socketIOServer.getRoomOperations("user_" + userId).sendEvent("user_locked");
    }

    @Override
    @Transactional
    public void hardDeleteUser(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        if (user.getRole() == UserRole.admin) {
            throw new RuntimeException("Cannot hard delete an ADMIN account");
        }

        // 1. Reassign Problems and Contests to Admin
        User defaultAdmin = userRepository.findByEmail("admin@codearena.com")
                .orElseGet(() -> userRepository.findAll().stream()
                        .filter(u -> u.getRole() == UserRole.admin).findFirst()
                        .orElseThrow(() -> new RuntimeException("System Admin not found to reassign data")));

        List<Problem> problems = problemRepository.findByCreatedById(userId);
        for (Problem p : problems) {
            p.setCreatedBy(defaultAdmin);
        }
        problemRepository.saveAll(problems);

        List<Contest> contests = contestRepository.findByCreatedById(userId, Pageable.unpaged()).getContent();
        for (Contest c : contests) {
            c.setCreatedBy(defaultAdmin);
        }
        contestRepository.saveAll(contests);

        List<ContestClarification> clarifs = contestClarificationRepository.findByAnsweredById(userId);
        for (ContestClarification clarif : clarifs) {
            clarif.setAnsweredBy(defaultAdmin);
        }
        contestClarificationRepository.saveAll(clarifs);

        // 2. Cascade delete Submissions, Contest Participants, Clarifications
        submissionRepository.deleteAllByUserId(userId);
        contestParticipantRepository.deleteAllByUserId(userId);
        contestClarificationRepository.deleteAllByUserId(userId);

        // 3. Delete the user (Profile and other cascades handled by JPA)
        userRepository.delete(user);
    }

    private AdminUserDTO toDTO(User u) {
        return AdminUserDTO.builder()
                .id(u.getId())
                .username(u.getUsername())
                .fullName(u.getFullName())
                .email(u.getEmail())
                .role(u.getRole() != null ? u.getRole().name() : com.codegym.spring_boot.entity.enums.UserRole.user.name())
                .createdAt(u.getCreatedAt() != null ? u.getCreatedAt().format(DATE_FMT) : "—")
                .isLocked(Boolean.TRUE.equals(u.getIsLocked()))
                .isDeleted(Boolean.TRUE.equals(u.getIsDeleted()))
                .build();
    }
}
