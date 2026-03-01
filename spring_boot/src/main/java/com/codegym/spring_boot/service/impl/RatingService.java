package com.codegym.spring_boot.service.impl;

import com.codegym.spring_boot.entity.Contest;
import com.codegym.spring_boot.entity.ContestParticipant;
import com.codegym.spring_boot.entity.User;
import com.codegym.spring_boot.repository.ContestParticipantRepository;
import com.codegym.spring_boot.repository.ContestRepository;
import com.codegym.spring_boot.repository.UserRepository;
import com.codegym.spring_boot.service.IRatingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RatingService implements IRatingService {

    private final ContestRepository contestRepository;
    private final ContestParticipantRepository participantRepository;
    private final UserRepository userRepository;

    // K-factor determines how volatile the ratings are
    private static final double K_FACTOR = 32.0;

    @Override
    @Transactional
    public void calculateAndApplyRatingChanges(Integer contestId) {
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new IllegalArgumentException("Contest not found: " + contestId));

        // Fetch participants ordered by rank (score desc, penalty asc)
        List<ContestParticipant> participants = participantRepository.findByIdContestIdOrderByTotalScoreDescTotalPenaltyAsc(contestId);
        int n = participants.size();
        
        if (n <= 1) {
            log.info("Not enough participants to calculate rating for contest {}.", contestId);
            return;
        }

        // Calculate expected score for each user against every other user
        double[] expectedScores = new double[n];
        double[] actualScores = new double[n];

        for (int i = 0; i < n; i++) {
            User userA = participants.get(i).getUser();
            double ratingA = userA.getGlobalRating() != null ? userA.getGlobalRating() : 1500;
            
            // Actual score is based on position (0 to 1, where 1 implies you beat them)
            // If rank is equal, score is 0.5. (Simplified: here everyone has unique rank based on sort order)
            // Expected score is the expected probability of A beating B
            for (int j = 0; j < n; j++) {
                if (i == j) continue;
                
                User userB = participants.get(j).getUser();
                double ratingB = userB.getGlobalRating() != null ? userB.getGlobalRating() : 1500;

                // Probability of A winning against B
                double probA = 1.0 / (1.0 + Math.pow(10, (ratingB - ratingA) / 400.0));
                expectedScores[i] += probA;

                // Actual outcome: A wins if i < j (since list is sorted by rank)
                if (i < j) {
                    actualScores[i] += 1.0;
                } else if (i > j) {
                    actualScores[i] += 0.0;
                }
            }
        }

        // Apply Elo rating changes
        for (int i = 0; i < n; i++) {
            User user = participants.get(i).getUser();
            double oldRating = user.getGlobalRating() != null ? user.getGlobalRating() : 1500;
            
            double ratingChange = K_FACTOR * (actualScores[i] - expectedScores[i]);
            // Normalize change - simple division by n-1 to keep shifts reasonable
            ratingChange = ratingChange / (n - 1); 
            
            int newRating = (int) Math.round(oldRating + ratingChange);
            
            // Ensure rating doesn't drop below 0
            if (newRating < 0) newRating = 0;

            user.setGlobalRating(newRating);
            userRepository.save(user);

            log.info("Contest {}: User {} (Rank {}) Rating updated: {} -> {} (Change: {})", 
                    contestId, user.getUsername(), i + 1, (int)oldRating, newRating, Math.round(ratingChange));
        }
        
        log.info("Finished rating calculation for contest {}.", contestId);
    }
}
