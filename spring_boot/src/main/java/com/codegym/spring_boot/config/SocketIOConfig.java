package com.codegym.spring_boot.config;

import com.codegym.spring_boot.security.JwtService;
import com.corundumstudio.socketio.AuthorizationResult;
import com.corundumstudio.socketio.Configuration;
import com.corundumstudio.socketio.SocketConfig;
import com.corundumstudio.socketio.SocketIOServer;
import com.codegym.spring_boot.dto.chat.request.SocketChatMessageRequest;
import com.codegym.spring_boot.entity.mongo.ChatMessage;
import com.codegym.spring_boot.service.IChatService;
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
                        log.info("Client {} (User {}) CONNECTED and joined room: {}", client.getSessionId(), userId,
                                roomName);
                    } else {
                        log.warn("Client {} CONNECTED but userId is null", client.getSessionId());
                    }
                } else {
                    log.warn("Client {} CONNECTED but token is null", client.getSessionId());
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

        // Live Camera Proctoring - WebRTC Signaling
        server.addEventListener("request-camera", com.codegym.spring_boot.dto.WebRTCSignalDTO.class,
                (client, data, ackSender) -> {
                    Integer userId = extractUserIdFromClient(client);
                    String role = extractRoleFromClient(client);
                    log.info("[SOCKET.IO] request-camera from User: {}, Role: {}, ToUser: {}", userId, role,
                            data.getToUserId());
                    if (userId != null && ("moderator".equalsIgnoreCase(role) || "admin".equalsIgnoreCase(role))) {
                        if (data.getToUserId() != null) {
                            String targetRoom = "user_" + data.getToUserId();
                            log.info("[SOCKET.IO] Forwarding moderator-request-cam from Mod {} to Room {}", userId,
                                    targetRoom);
                            server.getRoomOperations(targetRoom)
                                    .sendEvent("moderator-request-cam", userId); // sending the mod's ID
                        }
                    } else {
                        log.warn("[SOCKET.IO] Unauthorized request-camera from user {} with role {}", userId, role);
                    }
                });

        server.addEventListener("webrtc-signal", com.codegym.spring_boot.dto.WebRTCSignalDTO.class,
                (client, data, ackSender) -> {
                    Integer userId = extractUserIdFromClient(client);
                    log.info("[SOCKET.IO] webrtc-signal from User: {}, ToUser: {}", userId, data.getToUserId());
                    if (userId != null && data.getToUserId() != null) {
                        data.setFromUserId(userId);
                        String targetRoom = "user_" + data.getToUserId();
                        log.info("[SOCKET.IO] Forwarding webrtc-signal from {} to Room {}", userId, targetRoom);
                        server.getRoomOperations(targetRoom)
                                .sendEvent("webrtc-signal", data);
                    }
                });

        server.addEventListener("stop-proctoring", com.codegym.spring_boot.dto.WebRTCSignalDTO.class,
                (client, data, ackSender) -> {
                    Integer userId = extractUserIdFromClient(client);
                    log.info("[SOCKET.IO] stop-proctoring from User: {}, ToUser: {}", userId, data.getToUserId());
                    if (userId != null && data.getToUserId() != null) {
                        String targetRoom = "user_" + data.getToUserId();
                        server.getRoomOperations(targetRoom)
                                .sendEvent("stop-proctoring", userId);
                    }
                });

        // --- CONTEST GROUP CHAT ---
        server.addEventListener("join_contest_chat", Object.class, (client, data, ackSender) -> {
            try {
                Integer contestId = Integer.parseInt(data.toString());
                String room = "contest_chat_" + contestId;
                client.joinRoom(room);
                log.info("Client {} joined contest chat room: {}", client.getSessionId(), room);
            } catch (Exception e) {
                log.error("Invalid contestId in join_contest_chat: {}", data);
            }
        });

        server.addEventListener("leave_contest_chat", Object.class, (client, data, ackSender) -> {
            try {
                Integer contestId = Integer.parseInt(data.toString());
                String room = "contest_chat_" + contestId;
                client.leaveRoom(room);
                log.info("Client {} left contest chat room: {}", client.getSessionId(), room);
            } catch (Exception e) {
                log.error("Invalid contestId in leave_contest_chat: {}", data);
            }
        });

        server.addEventListener("send_chat_message",
                Object.class, (client, data, ackSender) -> {
                    Integer userId = extractUserIdFromClient(client);
                    log.info("Received send_chat_message raw from User {}, Data: {}", userId, data);

                    if (userId != null && data instanceof java.util.Map) {
                        try {
                            java.util.Map<?, ?> map = (java.util.Map<?, ?>) data;
                            Integer contestId = Integer.parseInt(map.get("contestId").toString());
                            String content = (String) map.get("content");

                            com.codegym.spring_boot.entity.mongo.ChatMessage savedMsg = chatService
                                    .saveMessage(contestId, userId, content);
                            String room = "contest_chat_" + contestId;

                            // Tránh lỗi Jackson không thể serialize LocalDateTime của netty-socketio
                            java.util.Map<String, Object> payload = new java.util.HashMap<>();
                            payload.put("id", savedMsg.getId());
                            payload.put("contestId", savedMsg.getContestId());
                            payload.put("senderId", savedMsg.getSenderId());
                            payload.put("senderName", savedMsg.getSenderName());
                            payload.put("senderAvatar", savedMsg.getSenderAvatar());
                            payload.put("content", savedMsg.getContent());
                            payload.put("timestamp",
                                    savedMsg.getTimestamp() != null ? savedMsg.getTimestamp().toString() : null);
                            payload.put("isSystem", savedMsg.isSystem());

                            // Gửi lại cho tất cả mọi người trong room "contest_chat_{id}"
                            server.getRoomOperations(room).sendEvent("new_chat_message", payload);

                            log.info("Chat message from User {} SAVED and BROADCASTED to room {}", userId, room);
                        } catch (Exception e) {
                            log.error("Failed to process chat message from user {}: {}", userId, e.getMessage(), e);
                            client.sendEvent("chat_error", e.getMessage());
                        }
                    } else {
                        log.warn("Invalid message payload or undefined user. UserId: {}, Data class: {}", userId,
                                data != null ? data.getClass().getName() : "null");
                    }
                });

        return server;
    }

    private final com.codegym.spring_boot.service.IChatService chatService;

    private Integer extractUserIdFromClient(com.corundumstudio.socketio.SocketIOClient client) {
        List<String> tokens = client.getHandshakeData().getUrlParams().get("token");
        String token = (tokens != null && !tokens.isEmpty()) ? tokens.get(0) : null;
        if (token != null) {
            try {
                return jwtService.extractUserId(token);
            } catch (Exception e) {
            }
        }
        return null;
    }

    private String extractRoleFromClient(com.corundumstudio.socketio.SocketIOClient client) {
        List<String> tokens = client.getHandshakeData().getUrlParams().get("token");
        String token = (tokens != null && !tokens.isEmpty()) ? tokens.get(0) : null;
        if (token != null) {
            try {
                return jwtService.extractRole(token);
            } catch (Exception e) {
            }
        }
        return null;
    }
}
