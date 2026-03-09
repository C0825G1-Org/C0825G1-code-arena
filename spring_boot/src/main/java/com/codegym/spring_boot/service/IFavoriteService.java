package com.codegym.spring_boot.service;

import com.codegym.spring_boot.dto.problem.ProblemUserDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface IFavoriteService {
    /**
     * Toggles a problem favorite status for the current user.
     * @param problemId ID of the problem to toggle
     * @return true if the problem is now favorited, false if it was removed
     */
    boolean toggleFavorite(Integer problemId);

    /**
     * Gets a list of problem IDs that the current user has favorited.
     * @return List of favorited problem IDs
     */
    List<Integer> getMyFavoriteProblemIds();

    /**
     * Gets a paginated list of problem details that the current user has favorited.
     * @param pageable Pagination info
     * @return Page of favorited problems (ProblemUserDTOs)
     */
    Page<ProblemUserDTO> getMyFavoriteProblems(Pageable pageable);
}
