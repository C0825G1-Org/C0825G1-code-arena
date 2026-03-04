package com.codegym.spring_boot.config;

import com.codegym.spring_boot.entity.User;
import com.codegym.spring_boot.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("Checking for Users with legacy 1500 globalRating...");
        List<User> usersToUpdate = userRepository.findAll().stream()
                .filter(u -> u.getGlobalRating() != null && (u.getGlobalRating() == 1500 || u.getGlobalRating() == 1550))
                .toList();
        
        if (!usersToUpdate.isEmpty()) {
            for (User user : usersToUpdate) {
                user.setGlobalRating(0); // Reset to new competitive default
            }
            userRepository.saveAll(usersToUpdate);
            log.info("Successfully updated {} legacy users to 0 globalRating.", usersToUpdate.size());
        } else {
            log.info("No legacy globalRating 1500 users found.");
        }
    }
}
