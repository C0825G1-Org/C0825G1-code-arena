package com.codegym.spring_boot.service;

import com.codegym.spring_boot.dto.problem.ProblemUserPageWrapperDTO;
import com.codegym.spring_boot.entity.User;
import com.codegym.spring_boot.entity.enums.Difficulty;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface IProblemUserService {
    ProblemUserPageWrapperDTO getAllProblemsForUser(String title, Difficulty difficulty, List<Integer> tagIds, String status, Pageable pageable, User currentUser);
}
