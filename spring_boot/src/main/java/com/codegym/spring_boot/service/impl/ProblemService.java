package com.codegym.spring_boot.service.impl;

import com.codegym.spring_boot.dto.problem.ProblemRequestDTO;
import com.codegym.spring_boot.dto.problem.ProblemResponseDTO;
import com.codegym.spring_boot.dto.tag.TagDTO;
import com.codegym.spring_boot.entity.Problem;
import com.codegym.spring_boot.entity.Tag;
import com.codegym.spring_boot.entity.User;
import com.codegym.spring_boot.entity.enums.UserRole;
import com.codegym.spring_boot.repository.IProblemRepository;
import com.codegym.spring_boot.repository.ITagRepository;
import com.codegym.spring_boot.repository.UserRepository;
import com.codegym.spring_boot.service.IProblemService;
import jakarta.persistence.NoResultException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ProblemService implements IProblemService {
    private final IProblemRepository problemRepository;
    private final ITagRepository tagRepository;
    private final UserRepository userRepository;

    public ProblemService(IProblemRepository problemRepository, ITagRepository tagRepository, com.codegym.spring_boot.repository.UserRepository userRepository) {
        this.problemRepository = problemRepository;
        this.tagRepository = tagRepository;
        this.userRepository = userRepository;
    }

    @Override
    public List<ProblemResponseDTO> getAllProblems() {
        return problemRepository.findAllByIsDeletedFalse().stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public ProblemResponseDTO getProblemById(Integer id) {
        Problem problem = problemRepository.findById(id)
                .filter(p -> !p.getIsDeleted())
                .orElseThrow(() -> new NoResultException("Không tìm thấy Problem có id: " + id));
        return mapToResponseDTO(problem);
    }

    @Override
    public ProblemResponseDTO createProblem(ProblemRequestDTO requestDTO) {
        if (problemRepository.existsBySlug(requestDTO.getSlug())) {
            throw new RuntimeException("Slug đã tồn tại, vui lòng chọn slug khác");
        }
        Problem problem = new Problem();
        mapToEntity(problem, requestDTO);

        // Lấy username của người dùng đang đăng nhập (từ token)
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsernameAndIsDeletedFalse(currentUsername)
                .orElseThrow(() -> new NoResultException("Không tìm thấy người dùng hiện tại"));
        problem.setCreatedBy(currentUser);

        Problem savedProblem = problemRepository.save(problem);
        return mapToResponseDTO(savedProblem);
    }

    @Override
    public ProblemResponseDTO updateProblem(Integer id, ProblemRequestDTO requestDTO) {
        Problem problem = problemRepository.findById(id).orElseThrow(() -> new NoResultException("Không tìm thấy Problem có id: " + id));

        checkModifyPermission(problem);

        if (Boolean.TRUE.equals(problem.getIsLocked())) {
            throw new IllegalStateException(
                    "Bài tập đang được sử dụng trong cuộc thi đang diễn ra. Không thể sửa/xóa.");
        }

        if (!problem.getSlug().equals(requestDTO.getSlug()) && problemRepository.existsBySlug(requestDTO.getSlug())) {
            throw new RuntimeException("Slug đã tồn tại, vui lòng chọn slug khác");
        }

        mapToEntity(problem, requestDTO);

        Problem updatedProblem = problemRepository.save(problem);
        return mapToResponseDTO(updatedProblem);
    }

    @Override
    public Boolean deleteProblem(Integer id) {
        Problem problem = problemRepository.findById(id).orElse(null);
        if (problem == null) {
            return false;
        }

        checkModifyPermission(problem);

        if (Boolean.TRUE.equals(problem.getIsLocked())) {
            throw new IllegalStateException(
                    "Bài tập đang được sử dụng trong cuộc thi đang diễn ra. Không thể sửa/xóa.");
        }

        problem.setIsDeleted(true);
        problemRepository.save(problem);
        return true;
    }

    private void checkModifyPermission(Problem problem) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsernameAndIsDeletedFalse(currentUsername)
                .orElseThrow(() -> new NoResultException("Không tìm thấy người dùng hiện tại"));

        if (currentUser.getRole() == UserRole.admin) {
            return;
        }

        if (currentUser.getRole() == UserRole.moderator) {
            if (problem.getCreatedBy() == null || !problem.getCreatedBy().getId().equals(currentUser.getId())) {
                throw new AccessDeniedException("Bạn chỉ có quyền sửa hoặc xóa bài toán do chính bạn tạo.");
            }
        } else {
            throw new AccessDeniedException("Bạn không có quyền thực hiện thao tác này.");
        }
    }

    private void mapToEntity(Problem problem, ProblemRequestDTO requestDTO) {
        problem.setTitle(requestDTO.getTitle());
        problem.setSlug(requestDTO.getSlug());
        problem.setDescription(requestDTO.getDescription());

        if (requestDTO.getDifficulty() != null) {
            problem.setDifficulty(requestDTO.getDifficulty());
        }
        if (requestDTO.getTimeLimit() != null) {
            problem.setTimeLimit(requestDTO.getTimeLimit());
        }
        if (requestDTO.getMemoryLimit() != null) {
            problem.setMemoryLimit(requestDTO.getMemoryLimit());
        }
        // Xử lý việc gắn Tag (Many-to-Many)
        if (requestDTO.getTagIds() != null && !requestDTO.getTagIds().isEmpty()) {
            Set<Tag> tags = new HashSet<>(tagRepository.findAllById(requestDTO.getTagIds()));
            problem.setTags(tags);
        } else {
            problem.setTags(new HashSet<>());
        }
    }


    private ProblemResponseDTO mapToResponseDTO(Problem problem) {
        ProblemResponseDTO response = new ProblemResponseDTO();
        response.setId(problem.getId());
        response.setTitle(problem.getTitle());
        response.setSlug(problem.getSlug());
        response.setDescription(problem.getDescription());
        response.setDifficulty(problem.getDifficulty());
        response.setTimeLimit(problem.getTimeLimit());
        response.setMemoryLimit(problem.getMemoryLimit());
        response.setTestcaseStatus(problem.getTestcaseStatus());

        if (problem.getTags() != null) {
            Set<TagDTO> tagDTOs = problem.getTags().stream()
                    .map(tag -> new TagDTO(tag.getId(), tag.getName()))
                    .collect(Collectors.toSet());
            response.setTags(tagDTOs);
        }
        return response;
    }
}
