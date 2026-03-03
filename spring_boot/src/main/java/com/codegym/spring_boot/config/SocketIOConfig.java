package com.codegym.spring_boot.config;

import com.codegym.spring_boot.security.JwtService;
import com.corundumstudio.socketio.AuthorizationResult;
import com.corundumstudio.socketio.Configuration;
import com.corundumstudio.socketio.SocketConfig;
import com.corundumstudio.socketio.SocketIOServer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;

import java.util.List;
import java.util.Map;

@Slf4j
@org.springframework.context.annotation.Configuration
@RequiredArgsConstructor
public class SocketIOConfig {

    private final JwtService jwtService;

    @Bean
    public SocketIOServer socketIOServer() {
        Configuration config = new Configuration();
        config.setHostname("0.0.0.0");
        config.setPort(9092);
        config.setOrigin("*");

        // Xác thực Token khi kết nối (Dành cho Netty-SocketIO 2.x)
        config.setAuthorizationListener(data -> {
            Map<String, List<String>> params = data.getUrlParams();
            List<String> tokens = params.get("token");
            String token = (tokens != null && !tokens.isEmpty()) ? tokens.get(0) : null;

            if (token != null && jwtService.validateTokenBasic(token)) {
                return AuthorizationResult.SUCCESSFUL_AUTHORIZATION;
            }
            log.warn("Socket.IO: Authorization failed for token: {}", token);
            return AuthorizationResult.FAILED_AUTHORIZATION;
        });

        SocketConfig socketConfig = new SocketConfig();
        socketConfig.setReuseAddress(true);
        config.setSocketConfig(socketConfig);

        SocketIOServer server = new SocketIOServer(config);

        // Tự động cho User vào Room riêng dựa trên UserId trong Token
        server.addConnectListener(client -> {
            Map<String, List<String>> params = client.getHandshakeData().getUrlParams();
            List<String> tokens = params.get("token");
            String token = (tokens != null && !tokens.isEmpty()) ? tokens.get(0) : null;
            try {
                if (token != null) {
                    Integer userId = jwtService.extractUserId(token);
                    if (userId != null) {
                        String roomName = "user_" + userId;
                        client.joinRoom(roomName);
                        log.info("Client {} (User {}) joined room: {}", client.getSessionId(), userId, roomName);
                    }
                }
            } catch (Exception e) {
                log.error("Error in Socket.IO ConnectListener", e);
            }
        });

        // Moderator Monitor Rooms
        server.addEventListener("join_monitor", String.class, (client, contestId, ackSender) -> {
            String room = "contest_monitor_" + contestId;
            client.joinRoom(room);
            log.info("Client {} joined monitor room: {}", client.getSessionId(), room);
        });

        server.addEventListener("leave_monitor", String.class, (client, contestId, ackSender) -> {
            String room = "contest_monitor_" + contestId;
            client.leaveRoom(room);
            log.info("Client {} left monitor room: {}", client.getSessionId(), room);
        });

        return server;
    }
}
