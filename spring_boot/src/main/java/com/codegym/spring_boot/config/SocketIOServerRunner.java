package com.codegym.spring_boot.config;

import com.corundumstudio.socketio.SocketIOServer;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class SocketIOServerRunner {

    private final SocketIOServer server;

    @PostConstruct
    public void startSocketIOServer() {
        try {
            server.start();
            log.info("Socket.IO server started on port 9092");
        } catch (Exception e) {
            log.error("Failed to start Socket.IO server: " + e.getMessage());
        }
    }

    @PreDestroy
    public void stopSocketIOServer() {
        if (server != null) {
            server.stop();
            log.info("Socket.IO server stopped");
        }
    }
}
