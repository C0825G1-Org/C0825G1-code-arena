package com.codegym.spring_boot.service.impl;

import com.codegym.spring_boot.dto.problem.ProblemUserDTO;
import com.codegym.spring_boot.dto.problem.ProblemUserPageWrapperDTO;
import com.codegym.spring_boot.dto.tag.TagDTO;
import com.codegym.spring_boot.entity.Problem;
import com.codegym.spring_boot.entity.Submission;
import com.codegym.spring_boot.entity.Tag;
import com.codegym.spring_boot.entity.User;
import com.codegym.spring_boot.entity.enums.Difficulty;
import com.codegym.spring_boot.entity.enums.SubmissionStatus;
import com.codegym.spring_boot.entity.enums.TestCaseStatus;
import com.codegym.spring_boot.entity.FavoriteProblem;
import com.codegym.spring_boot.repository.IProblemUserRepository;
import com.codegym.spring_boot.repository.SubmissionRepository;
import com.codegym.spring_boot.service.IProblemUserService;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProblemUserService implements IProblemUserService {
    private final IProblemUserRepository problemUserRepository;
    private final SubmissionRepository submissionRepository;

    @Override
    public ProblemUserPageWrapperDTO getAllProblemsForUser(String title, Difficulty difficulty, List<Integer> tagIds, String status, Boolean isFavorite, Pageable pageable, User currentUser) {
        Specification<Problem> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("isDeleted"), false));
            predicates.add(cb.equal(root.get("testcaseStatus"), TestCaseStatus.ready));

            if (title != null && !title.isBlank()) {
                Predicate titleMatch = cb.like(cb.lower(root.get("title")), "%" + title.toLowerCase() + "%");
                try {
                    Integer idParse = Integer.parseInt(title.trim());
                    Predicate idMatch = cb.equal(root.get("id"), idParse);
                    predicates.add(cb.or(titleMatch, idMatch));
                } catch (NumberFormatException e) {
                    predicates.add(titleMatch);
                }
            }

            if (difficulty != null) {
                predicates.add(cb.equal(root.get("difficulty"), difficulty));
            }

            if (tagIds != null && !tagIds.isEmpty()) {
                Join<Problem, Tag> tags = root.join("tags");
                predicates.add(tags.get("id").in(tagIds));
                query.distinct(true);
            }

            if (status != null && !status.isBlank() && currentUser != null) {
                Subquery<Integer> subquery = query.subquery(Integer.class);
                Root<Submission> subRoot = subquery.from(Submission.class);
                
                if ("SOLVED".equalsIgnoreCase(status)) {
                    subquery.select(cb.literal(1))
                            .where(cb.equal(subRoot.get("problem"), root),
                                   cb.equal(subRoot.get("user").get("id"), currentUser.getId()),
                                   cb.equal(subRoot.get("status"), SubmissionStatus.AC));
                    predicates.add(cb.exists(subquery));
                } else if ("UNATTEMPTED".equalsIgnoreCase(status)) {
                    subquery.select(cb.literal(1))
                            .where(cb.equal(subRoot.get("problem"), root),
                                   cb.equal(subRoot.get("user").get("id"), currentUser.getId()));
                    predicates.add(cb.not(cb.exists(subquery)));
                } else if ("ATTEMPTED".equalsIgnoreCase(status)) {
                    // Has attempt
                    subquery.select(cb.literal(1))
                            .where(cb.equal(subRoot.get("problem"), root),
                                   cb.equal(subRoot.get("user").get("id"), currentUser.getId()));
                    
                    // But Not AC
                    Subquery<Integer> acSubquery = query.subquery(Integer.class);
                    Root<Submission> acSubRoot = acSubquery.from(Submission.class);
                    acSubquery.select(cb.literal(1))
                              .where(cb.equal(acSubRoot.get("problem"), root),
                                     cb.equal(acSubRoot.get("user").get("id"), currentUser.getId()),
                                     cb.equal(acSubRoot.get("status"), SubmissionStatus.AC));
                    
                    predicates.add(cb.and(cb.exists(subquery), cb.not(cb.exists(acSubquery))));
                }
            }

            if (Boolean.TRUE.equals(isFavorite) && currentUser != null) {
                Subquery<Integer> favoriteSubquery = query.subquery(Integer.class);
                Root<FavoriteProblem> favoriteRoot = favoriteSubquery.from(FavoriteProblem.class);
                favoriteSubquery.select(cb.literal(1))
                        .where(cb.equal(favoriteRoot.get("problem"), root),
                               cb.equal(favoriteRoot.get("user").get("id"), currentUser.getId()));
                predicates.add(cb.exists(favoriteSubquery));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Problem> problemsPage = problemUserRepository.findAll(spec, pageable);

        List<Integer> problemIds = problemsPage.getContent().stream().map(Problem::getId).collect(Collectors.toList());
        Set<Integer> solvedIds = new HashSet<>();
        Set<Integer> attemptedIds = new HashSet<>();

        if (currentUser != null && !problemIds.isEmpty()) {
            solvedIds.addAll(submissionRepository.findSolvedProblemIdsByUserIdAndProblemIds(currentUser.getId(), SubmissionStatus.AC, problemIds));
            attemptedIds.addAll(submissionRepository.findAttemptedProblemIdsByUserIdAndProblemIds(currentUser.getId(), problemIds));
        }

        Page<ProblemUserDTO> dtoPage = problemsPage.map(p -> {
            String userStatus = "UNATTEMPTED";
            if (solvedIds.contains(p.getId())) {
                userStatus = "SOLVED";
            } else if (attemptedIds.contains(p.getId())) {
                userStatus = "ATTEMPTED";
            }
            return mapToUserDTO(p, userStatus);
        });

        long totalProblems = problemUserRepository.countTotalActiveProblems();
        long solvedProblems = currentUser != null ? submissionRepository.countDistinctProblemByUserIdAndStatus(currentUser.getId(), SubmissionStatus.AC) : 0;

        return new ProblemUserPageWrapperDTO(dtoPage, totalProblems, solvedProblems);
    }

    private ProblemUserDTO mapToUserDTO(Problem problem, String userStatus) {
        Set<TagDTO> tags = null;
        if (problem.getTags() != null) {
            tags = problem.getTags().stream()
                    .map(t -> new TagDTO(t.getId(), t.getName()))
                    .collect(Collectors.toSet());
        }
        return ProblemUserDTO.builder()
                .id(problem.getId())
                .title(problem.getTitle())
                .slug(problem.getSlug())
                .difficulty(problem.getDifficulty())
                .tags(tags)
                .userStatus(userStatus)
                .build();
    }
}
