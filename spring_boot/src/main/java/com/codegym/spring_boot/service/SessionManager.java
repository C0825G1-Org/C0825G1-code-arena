package com.codegym.spring_boot.service;

import org.springframework.stereotype.Service;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class SessionManager {
    // Set to store user IDs of currently logged-in users who have an active socket connection
    private final Set<Integer> activeUserIds = ConcurrentHashMap.newKeySet();

    public void addSession(Integer userId) {
        if (userId != null) {
            activeUserIds.add(userId);
            log.info("User {} marked as online. Active users: {}", userId, activeUserIds.size());
        }
    }

    public void removeSession(Integer userId) {
        if (userId != null) {
            activeUserIds.remove(userId);
            log.info("User {} marked as offline. Active users: {}", userId, activeUserIds.size());
        }
    }

    public boolean isUserLoggedIn(Integer userId) {
        return userId != null && activeUserIds.contains(userId);
    }
}
