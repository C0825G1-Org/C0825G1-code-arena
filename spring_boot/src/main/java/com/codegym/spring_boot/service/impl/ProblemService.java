package com.codegym.spring_boot.service.impl;

import com.codegym.spring_boot.dto.problem.ProblemRequestDTO;
import lombok.extern.slf4j.Slf4j;
import com.codegym.spring_boot.dto.problem.ProblemResponseDTO;
import com.codegym.spring_boot.dto.tag.TagDTO;
import com.codegym.spring_boot.entity.Problem;
import com.codegym.spring_boot.entity.Tag;
import com.codegym.spring_boot.entity.User;
import com.codegym.spring_boot.entity.enums.UserRole;
import com.codegym.spring_boot.dto.problem.ProblemIOTemplateDTO;
import com.codegym.spring_boot.entity.ProblemIOTemplate;
import com.codegym.spring_boot.repository.*;
import com.codegym.spring_boot.service.ContestService;
import com.codegym.spring_boot.service.ITestCaseService;
import com.codegym.spring_boot.service.IProblemService;
import com.codegym.spring_boot.entity.ContestProblem;
import com.codegym.spring_boot.entity.enums.ContestStatus;
import com.codegym.spring_boot.entity.enums.TestCaseStatus;
import jakarta.persistence.NoResultException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
@Slf4j
public class ProblemService implements IProblemService {
    private final IProblemRepository problemRepository;
    private final ITagRepository tagRepository;
    private final UserRepository userRepository;
    private final ContestProblemRepository contestProblemRepository;
    private final ContestService contestService;
    private final LanguageRepository languageRepository;
    private final ITestCaseService testCaseService;
    private final FavoriteProblemRepository favoriteProblemRepository;
    private final ProblemDiscussionRepository problemDiscussionRepository;

    public ProblemService(IProblemRepository problemRepository,
            ITagRepository tagRepository,
            UserRepository userRepository,
            ContestProblemRepository contestProblemRepository,
            ContestService contestService,
            LanguageRepository languageRepository,
            ITestCaseService testCaseService,
            FavoriteProblemRepository favoriteProblemRepository,
            ProblemDiscussionRepository problemDiscussionRepository) {
        this.problemRepository = problemRepository;
        this.tagRepository = tagRepository;
        this.userRepository = userRepository;
        this.contestProblemRepository = contestProblemRepository;
        this.contestService = contestService;
        this.languageRepository = languageRepository;
        this.testCaseService = testCaseService;
        this.favoriteProblemRepository = favoriteProblemRepository;
        this.problemDiscussionRepository = problemDiscussionRepository;
    }

    @Override
    public List<ProblemResponseDTO> getAllProblems(Boolean manage) {
        if (manage != null && manage) {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = userRepository.findByUsernameAndIsDeletedFalse(currentUsername).orElse(null);

            if (currentUser != null && currentUser.getRole() == UserRole.moderator) {
                return problemRepository.findAllByCreatedByAndIsDeletedFalse(currentUser).stream()
                        .map(this::mapToResponseDTO)
                        .collect(Collectors.toList());
            }

            if (currentUser != null && currentUser.getRole() == UserRole.admin) {
                return problemRepository.findAllByIsDeletedFalse().stream()
                        .map(this::mapToResponseDTO)
                        .collect(Collectors.toList());
            }
        }

        return problemRepository.findAllByIsDeletedFalse().stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public ProblemResponseDTO getProblemById(Integer id) {
        Problem problem = problemRepository.findById(id)
                .filter(p -> !Boolean.TRUE.equals(p.getIsDeleted()))
                .orElseThrow(() -> new NoResultException("Không tìm thấy Problem có id: " + id));

        checkReadPermission(problem);

        return mapToResponseDTO(problem);
    }

    @Override
    public ProblemResponseDTO getProblemBySlug(String slug) {
        Problem problem = problemRepository.findBySlug(slug)
                .filter(p -> !Boolean.TRUE.equals(p.getIsDeleted()))
                .orElseThrow(() -> new NoResultException("Không tìm thấy Problem có slug: " + slug));

        checkReadPermission(problem);

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
        Problem problem = problemRepository.findById(id)
                .orElseThrow(() -> new NoResultException("Không tìm thấy Problem có id: " + id));

        checkModifyPermission(problem);
        checkIfProblemInActiveContest(id);

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
        checkIfProblemInActiveContest(id);

        problem.setIsDeleted(true);
        problemRepository.save(problem);

        // Cleanup related data
        testCaseService.deleteByProblemId(id);
        favoriteProblemRepository.deleteAllByProblemId(id);
        problemDiscussionRepository.deleteByProblemId(id);
        contestProblemRepository.deleteByIdProblemId(id);

        return true;
    }

    @Override
    public Boolean restoreProblem(Integer id) {
        Problem problem = problemRepository.findById(id).orElse(null);
        if (problem == null || !Boolean.TRUE.equals(problem.getIsDeleted())) {
            return false;
        }

        checkModifyPermission(problem);

        problem.setIsDeleted(false);
        // Reset status vì testcase đã bị xóa cứng khi delete
        problem.setTestcaseStatus(TestCaseStatus.not_uploaded);
        problemRepository.save(problem);
        return true;
    }

    private void checkIfProblemInActiveContest(Integer problemId) {
        List<ContestProblem> contests = contestProblemRepository.findByIdProblemId(problemId);
        for (ContestProblem cp : contests) {
            ContestStatus realStatus = contestService.computeRealTimeStatus(cp.getContest());
            if (realStatus == ContestStatus.active) {
                throw new IllegalStateException(
                        "Bài tập đang nằm trong cuộc thi đang diễn ra. Không thể sửa/xóa.");
            }
        }
    }

    private void checkReadPermission(Problem problem) {
        // Mọi người (bao gồm khách và thí sinh) đều có thể xem đề bài bất cứ lúc nào.
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

        // Xử lý I/O Templates
        if (requestDTO.getIoTemplates() != null) {
            // Trong bối cảnh Transactional, ta có thể clear và add lại
            if (problem.getIoTemplates() == null) {
                problem.setIoTemplates(new HashSet<>());
            } else {
                problem.getIoTemplates().clear();
            }

            for (ProblemIOTemplateDTO dto : requestDTO.getIoTemplates()) {
                if (dto.getLanguageId() == null || dto.getTemplateCode() == null)
                    continue;

                var language = languageRepository.findById(dto.getLanguageId()).orElse(null);
                if (language != null) {
                    ProblemIOTemplate template = ProblemIOTemplate.builder()
                            .problem(problem)
                            .language(language)
                            .templateCode(dto.getTemplateCode())
                            .build();
                    problem.getIoTemplates().add(template);
                }
            }
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

        if (problem.getCreatedBy() != null) {
            response.setAuthorId(problem.getCreatedBy().getId());
            response.setAuthorUsername(problem.getCreatedBy().getUsername());
            response.setAuthorName(problem.getCreatedBy().getFullName());
        }

        if (problem.getTags() != null) {
            Set<TagDTO> tagDTOs = problem.getTags().stream()
                    .map(tag -> new TagDTO(tag.getId(), tag.getName()))
                    .collect(Collectors.toSet());
            response.setTags(tagDTOs);
        }

        if (problem.getIoTemplates() != null) {
            Set<ProblemIOTemplateDTO> ioTemplateDTOs = problem.getIoTemplates().stream()
                    .map(template -> ProblemIOTemplateDTO.builder()
                            .languageId(template.getLanguage().getId())
                            .languageName(template.getLanguage().getName())
                            .templateCode(template.getTemplateCode())
                            .build())
                    .collect(Collectors.toSet());
            response.setIoTemplates(ioTemplateDTOs);
        }

        response.setIsDeleted(problem.getIsDeleted());

        return response;
    }
}
