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

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RatingService implements IRatingService {

    private final ContestRepository contestRepository;
    private final ContestParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final com.codegym.spring_boot.service.IShopService shopService;

    // K-factor determines how volatile the ratings are
    private static final double K_FACTOR = 16.0;

    @Override
    @Transactional
    public void calculateAndApplyRatingChanges(Integer contestId) {
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new IllegalArgumentException("Contest not found: " + contestId));

        // 1. Dùng Join Fetch trong Repo để lấy User luôn, tránh N+1
        List<ContestParticipant> participants = participantRepository.findAllWithUserByContestId(contestId);
        int n = participants.size();
        
        if (n <= 1) {
            log.info("Not enough participants to calculate rating for contest {}.", contestId);
            return;
        }

        double[] deltas = new double[n];
        double totalDelta = 0;

        // 2. Tính toán Delta
        for (int i = 0; i < n; i++) {
            User userA = participants.get(i).getUser();
            double ratingA = userA.getGlobalRating() != null ? userA.getGlobalRating() : 0;
            
            double expectedScore = 0;
            double actualScore = 0;

            for (int j = 0; j < n; j++) {
                if (i == j) continue;
                
                User userB = participants.get(j).getUser();
                double ratingB = userB.getGlobalRating() != null ? userB.getGlobalRating() : 0;

                // Caching difference
                double diff = ratingB - ratingA;
                
                // Determine probability
                double probA = 1.0 / (1.0 + Math.pow(10, diff / 400.0));
                
                // Boost probability calculation for absolute beginners to allow faster climbing
                if (ratingA == 0 && ratingB > 0) probA = 0.2; // underdog boost
                
                expectedScore += probA;

                // Xử lý đồng hạng (Ties)
                if (participants.get(i).getTotalScore() > participants.get(j).getTotalScore()) {
                    actualScore += 1.0;
                } else if (participants.get(i).getTotalScore() < participants.get(j).getTotalScore()) {
                    actualScore += 0.0;
                } else {
                    // Nếu cùng Score, check Penalty
                    if (participants.get(i).getTotalPenalty() < participants.get(j).getTotalPenalty()) {
                        actualScore += 1.0;
                    } else if (participants.get(i).getTotalPenalty() > participants.get(j).getTotalPenalty()) {
                        actualScore += 0.0;
                    } else {
                        actualScore += 0.5; // Hòa
                    }
                }
            }
            
            deltas[i] = (K_FACTOR * (actualScore - expectedScore)) / (n - 1);
            totalDelta += deltas[i];
        }

        // 3. Chống lạm phát (Zero-sum adjustment)
        double adjustment = totalDelta / n;
        List<User> usersToUpdate = new ArrayList<>();

        for (int i = 0; i < n; i++) {
            User user = participants.get(i).getUser();
            int oldRating = user.getGlobalRating() != null ? user.getGlobalRating() : 0;
            int practiceRating = user.getPracticeRating() != null ? user.getPracticeRating() : 0;
            
            int finalChange = (int) Math.round(deltas[i] - adjustment);
            int newRating = Math.max(0, oldRating + finalChange);
            
            user.setPreviousGlobalRating(oldRating);
            user.setPreviousTotalRating(oldRating * 2 + practiceRating);
            user.setGlobalRating(newRating);
            // Add to shopBalance (Contest gives 2x points to Total ELO)
            if (finalChange > 0) {
                int shopBalanceCurrent = user.getShopBalance() != null ? user.getShopBalance() : 0;
                user.setShopBalance(shopBalanceCurrent + (finalChange * 2));
            }
            usersToUpdate.add(user);

            log.info("Contest {}: User {} (Rank {}) Rating updated: {} -> {} (Change: {})", 
                    contestId, user.getUsername(), i + 1, oldRating, newRating, finalChange);
        }

        // 4. Update hàng loạt một lần duy nhất
        userRepository.saveAll(usersToUpdate);
        log.info("Finished rating calculation for contest {}. Zero-sum adjustment: {}", contestId, adjustment);
    }
}
