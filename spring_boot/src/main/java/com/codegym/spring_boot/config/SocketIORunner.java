package com.codegym.spring_boot.config;

import com.corundumstudio.socketio.SocketIOServer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import jakarta.annotation.PreDestroy;

@Component
@RequiredArgsConstructor
@Slf4j
public class SocketIORunner implements CommandLineRunner {

    private final SocketIOServer server;

    @Override
    public void run(String... args) throws Exception {
        log.info(">>> [SOCKET.IO] Starting Socket.IO server on port 9092...");
        try {
            server.start();
            log.info(">>> [SOCKET.IO] Socket.IO server started successfully.");
        } catch (Exception e) {
            log.error("!!! [SOCKET.IO] Failed to start Socket.IO server", e);
        }
    }

    @PreDestroy
    public void stopServer() {
        log.info(">>> [SOCKET.IO] Stopping Socket.IO server...");
        server.stop();
    }
}
