package com.codegym.spring_boot.service;

public interface IRatingService {
    /**
     * Calculates and updates the Elo rating for all participants 
     * in a contest after it has finished.
     */
    void calculateAndApplyRatingChanges(Integer contestId);
}
