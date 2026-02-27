package com.codegym.spring_boot.security;

import com.corundumstudio.socketio.SocketIOServer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class SocketAuthListener {

    private final JwtService jwtService;

    @Autowired
    public void register(SocketIOServer server) {
        server.addConnectListener(client -> {
            String token = client.getHandshakeData().getSingleUrlParam("token");

            if (token == null || !jwtService.validateTokenBasic(token)) {
                log.warn("Socket.IO: Auth failed or no token provided. Disconnecting...");
                client.disconnect();
                return;
            }

            Integer userId = jwtService.extractUserId(token);
            if (userId != null) {
                client.set("userId", userId);
                String roomName = "user_" + userId;
                client.joinRoom(roomName);
                log.info("Socket.IO: User {} connected and joined room {}", userId, roomName);
            } else {
                client.disconnect();
            }
        });

        server.addDisconnectListener(client -> {
            Integer userId = client.get("userId");
            if (userId != null) {
                log.info("Socket.IO: User {} disconnected", userId);
            }
        });
    }
}
