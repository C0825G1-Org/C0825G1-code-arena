package com.codegym.spring_boot.service.impl;

import com.codegym.spring_boot.dto.problem.ProblemUserDTO;
import com.codegym.spring_boot.dto.tag.TagDTO;
import com.codegym.spring_boot.entity.FavoriteProblem;
import com.codegym.spring_boot.entity.Problem;
import com.codegym.spring_boot.entity.User;
import com.codegym.spring_boot.repository.FavoriteProblemRepository;
import com.codegym.spring_boot.repository.IProblemRepository;
import com.codegym.spring_boot.repository.SubmissionRepository;
import com.codegym.spring_boot.repository.UserRepository;
import com.codegym.spring_boot.service.IFavoriteService;
import jakarta.persistence.NoResultException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FavoriteService implements IFavoriteService {

    private final FavoriteProblemRepository favoriteProblemRepository;
    private final IProblemRepository problemRepository;
    private final UserRepository userRepository;
    private final SubmissionRepository submissionRepository;

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsernameAndIsDeletedFalse(username)
                .orElseThrow(() -> new AccessDeniedException("Người dùng chưa đăng nhập hoặc không tồn tại"));
    }

    @Override
    @Transactional
    public boolean toggleFavorite(Integer problemId) {
        User user = getCurrentUser();
        Problem problem = problemRepository.findById(problemId)
                .filter(p -> !Boolean.TRUE.equals(p.getIsDeleted()))
                .orElseThrow(() -> new NoResultException("Không tìm thấy Problem có id: " + problemId));

        Optional<FavoriteProblem> existingFavorite = favoriteProblemRepository.findByUserAndProblem(user, problem);

        if (existingFavorite.isPresent()) {
            favoriteProblemRepository.delete(existingFavorite.get());
            return false; // Được báo hiệu là đã unlike
        } else {
            FavoriteProblem newFavorite = FavoriteProblem.builder()
                    .user(user)
                    .problem(problem)
                    .build();
            favoriteProblemRepository.save(newFavorite);
            return true; // Được báo hiệu là đã like
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<Integer> getMyFavoriteProblemIds() {
        User user = getCurrentUser();
        return favoriteProblemRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(fp -> fp.getProblem().getId())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProblemUserDTO> getMyFavoriteProblems(Pageable pageable) {
        User user = getCurrentUser();
        Page<FavoriteProblem> favoriteProblemPage = favoriteProblemRepository.findByUserOrderByCreatedAtDesc(user, pageable);

        List<Problem> favoriteProblems = favoriteProblemPage.getContent().stream()
                .map(FavoriteProblem::getProblem)
                .collect(Collectors.toList());

        List<Integer> problemIds = favoriteProblems.stream().map(Problem::getId).collect(Collectors.toList());
        
        List<Integer> solvedIds = List.of();
        List<Integer> attemptedIds = List.of();
        if (!problemIds.isEmpty()) {
            solvedIds = submissionRepository.findSolvedProblemIdsByUserIdAndProblemIds(
                    user.getId(), com.codegym.spring_boot.entity.enums.SubmissionStatus.AC, problemIds);
            attemptedIds = submissionRepository.findAttemptedProblemIdsByUserIdAndProblemIds(
                    user.getId(), problemIds);
        }

        List<Integer> finalSolvedIds = solvedIds;
        List<Integer> finalAttemptedIds = attemptedIds;

        return favoriteProblemPage.map(fp -> {
            ProblemUserDTO dto = mapToUserDTO(fp.getProblem());
            if (finalSolvedIds.contains(dto.getId())) {
                dto.setUserStatus("SOLVED");
            } else if (finalAttemptedIds.contains(dto.getId())) {
                dto.setUserStatus("ATTEMPTED");
            } else {
                dto.setUserStatus("UNATTEMPTED");
            }
            return dto;
        });
    }

    private ProblemUserDTO mapToUserDTO(Problem problem) {
        ProblemUserDTO response = new ProblemUserDTO();
        response.setId(problem.getId());
        response.setTitle(problem.getTitle());
        response.setSlug(problem.getSlug());
        response.setDifficulty(problem.getDifficulty());

        if (problem.getTags() != null) {
            response.setTags(problem.getTags().stream()
                    .map(tag -> new TagDTO(tag.getId(), tag.getName()))
                    .collect(Collectors.toSet()));
        }
        return response;
    }
}
