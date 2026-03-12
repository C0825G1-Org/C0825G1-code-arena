package com.codegym.spring_boot.util;

import com.codegym.spring_boot.entity.Problem;
import com.codegym.spring_boot.entity.Submission;
import com.codegym.spring_boot.entity.User;
import com.codegym.spring_boot.entity.enums.SubmissionStatus;
import com.codegym.spring_boot.repository.SubmissionRepository;
import com.codegym.spring_boot.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class PracticeEloMigration {

    private final UserRepository userRepository;
    private final SubmissionRepository submissionRepository;

    @Transactional
    public void migrate() {
        log.info("Starting Practice Elo Migration...");

        // 1. Reset all practice ratings to 0
        List<User> users = userRepository.findAll();
        for (User user : users) {
            user.setPracticeRating(0);
        }
        userRepository.saveAll(users);
        
        Map<Integer, User> userCache = new HashMap<>();
        for (User u : users) userCache.put(u.getId(), u);

        // 2. Find all AC submissions for non-contest problems, sorted by createdAt
        List<Submission> acSubmissions = submissionRepository.findByContestIsNullAndStatusOrderByIdAsc(SubmissionStatus.AC);
        
        // 3. Keep track of which (user, problem) pairs have already been processed
        Set<String> processedPairs = new HashSet<>();
        List<User> updatedUsers = new ArrayList<>();

        for (Submission sub : acSubmissions) {
            Integer userId = sub.getUser().getId();
            Integer problemId = sub.getProblem().getId();
            String key = userId + "_" + problemId;

            if (!processedPairs.contains(key)) {
                User user = userCache.get(userId);
                Problem problem = sub.getProblem();
                
                updatePracticeRating(user, problem);
                processedPairs.add(key);
                
                if (!updatedUsers.contains(user)) {
                    updatedUsers.add(user);
                }
            }
        }

        userRepository.saveAll(updatedUsers);
        log.info("Practice Elo Migration finished. Processed {} unique solves.", processedPairs.size());
    }

    private void updatePracticeRating(User user, Problem problem) {
        double userRating = user.getPracticeRating() != null ? user.getPracticeRating() : 0;
        double problemRating = switch (problem.getDifficulty()) {
            case easy -> 800.0;
            case medium -> 1200.0;
            case hard -> 1800.0;
        };

        double kFactor = 16.0;
        double expectedScore = 1.0 / (1.0 + Math.pow(10, (problemRating - userRating) / 400.0));
        
        int ratingChange = (int) Math.round(kFactor * (1.0 - expectedScore));
        if (ratingChange < 1) ratingChange = 1;

        user.setPracticeRating((int) (userRating + ratingChange));
    }
}
