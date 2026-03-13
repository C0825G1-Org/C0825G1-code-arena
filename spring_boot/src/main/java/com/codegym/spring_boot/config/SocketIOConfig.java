package com.codegym.spring_boot.config;

import com.codegym.spring_boot.security.JwtService;
import com.corundumstudio.socketio.AuthorizationResult;
import com.corundumstudio.socketio.Configuration;
import com.corundumstudio.socketio.SocketConfig;
import com.corundumstudio.socketio.SocketIOServer;
import com.codegym.spring_boot.repository.ContestParticipantRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;

import java.util.List;
import java.util.Map;

@Slf4j
@org.springframework.context.annotation.Configuration
// @RequiredArgsConstructor
public class SocketIOConfig {

    private final JwtService jwtService;
    private final ContestParticipantRepository participantRepository;
    private final com.codegym.spring_boot.repository.UserRepository userRepository;
    private final com.codegym.spring_boot.service.SessionManager sessionManager;
    private com.codegym.spring_boot.service.IChatService chatService;

    public SocketIOConfig(JwtService jwtService,
                          ContestParticipantRepository participantRepository,
                          com.codegym.spring_boot.repository.UserRepository userRepository,
                          com.codegym.spring_boot.service.SessionManager sessionManager,
                          @org.springframework.beans.factory.annotation.Autowired(required = false) com.codegym.spring_boot.service.IChatService chatService) {
        this.jwtService = jwtService;
        this.participantRepository = participantRepository;
        this.userRepository = userRepository;
        this.sessionManager = sessionManager;
        this.chatService = chatService;
    }

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
                        client.set("userId", userId); // Critical for tracking the socket owner!
                        sessionManager.addSession(userId); // Mark user as online
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

        server.addDisconnectListener(client -> {
            try {
                // Safely get userId from the socket state. If the JWT expired while connected, 
                // extracting it from handshake data WILL fail here, leaving the session stuck!
                Integer userId = client.get("userId");
                if (userId == null) {
                    userId = extractUserIdFromClient(client); // Fallback
                }
                if (userId != null) {
                    sessionManager.removeSession(userId); // Mark user as offline
                    log.info("Client {} (User {}) DISCONNECTED", client.getSessionId(), userId);
                } else {
                    log.warn("Client {} DISCONNECTED without a tracked userId!", client.getSessionId());
                }
            } catch (Exception e) {
                log.error("Error in Socket.IO DisconnectListener", e);
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
                            if (chatService != null) {
                                java.util.Map<?, ?> map = (java.util.Map<?, ?>) data;
                                Integer contestId = Integer.parseInt(map.get("contestId").toString());
                                String content = (String) map.get("content");

                                // KIỂM TRA KHÓA CHAT
                                com.codegym.spring_boot.entity.User user = userRepository.findById(userId).orElse(null);
                                if (user != null && Boolean.TRUE.equals(user.getIsContestChatLocked())) {
                                    log.warn("User {} is LOCKED from contest chat. Message rejected.", userId);
                                    client.sendEvent("chat_error",
                                            "Tài khoản của bạn đã bị khóa tính năng chat trong cuộc thi.");
                                    return;
                                }

                                com.codegym.spring_boot.entity.mongo.ChatMessage savedMsg = chatService
                                        .saveMessage(contestId, userId, content);

                                if (savedMsg == null) {
                                    log.warn("Failed to save/process chat message from User {}", userId);
                                    return;
                                }

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
                            } else {
                                log.warn("Chat feature is currently disabled (No MongoDB)");
                                client.sendEvent("chat_error", "Tính năng chat hiện đang tạm tắt.");
                            }
                        } catch (Exception e) {
                            log.error("Failed to process chat message from user {}: {}", userId, e.getMessage(), e);
                            client.sendEvent("chat_error", e.getMessage());
                        }
                    } else {
                        log.warn("Invalid message payload or undefined user. UserId: {}, Data class: {}", userId,
                                data != null ? data.getClass().getName() : "null");
                    }
                });

        // Camera Violation Reporting (Participant -> Moderator)
        server.addEventListener("report-camera-violation", java.util.Map.class, (client, data, ackSender) -> {
            Integer userId = extractUserIdFromClient(client);
            if (userId != null) {
                try {
                    Integer contestId = Integer.parseInt(data.get("contestId").toString());
                    Boolean isViolating = (Boolean) data.get("isViolating");

                    var participantOpt = participantRepository.findByContestIdAndUserId(contestId, userId);
                    if (participantOpt.isPresent()) {
                        var p = participantOpt.get();
                        p.setIsCameraViolating(isViolating);
                        participantRepository.save(p);
                        log.info("User {} camera violation status updated to {} in contest {}", userId, isViolating, contestId);

                        // Broadcast to monitor room
                        String monitorRoom = "contest_monitor_" + contestId;
                        java.util.Map<String, Object> payload = new java.util.HashMap<>();
                        payload.put("userId", userId);
                        payload.put("isCameraViolating", isViolating);
                        server.getRoomOperations(monitorRoom).sendEvent("monitor_camera_violation", payload);
                    }
                } catch (Exception e) {
                    log.error("Error in report-camera-violation", e);
                }
            }
        });

        // Moderator Actions (Moderator -> Participant)
        server.addEventListener("moderator-warn-participant", java.util.Map.class, (client, data, ackSender) -> {
            Integer userId = extractUserIdFromClient(client);
            String role = extractRoleFromClient(client);
            if (userId != null && ("moderator".equalsIgnoreCase(role) || "admin".equalsIgnoreCase(role))) {
                try {
                    Integer toUserId = Integer.parseInt(data.get("toUserId").toString());
                    String targetRoom = "user_" + toUserId;
                    server.getRoomOperations(targetRoom).sendEvent("warn-camera", "Moderator yêu cầu bạn bật Camera ngay lập tức để tiếp tục bài thi.");
                    log.info("Moderator {} sent camera warning to User {}", userId, toUserId);
                } catch (Exception e) {
                    log.error("Error in moderator-warn-participant", e);
                }
            }
        });

        server.addEventListener("moderator-kick-participant", java.util.Map.class, (client, data, ackSender) -> {
            Integer userId = extractUserIdFromClient(client);
            String role = extractRoleFromClient(client);
            if (userId != null && ("moderator".equalsIgnoreCase(role) || "admin".equalsIgnoreCase(role))) {
                try {
                    Integer toUserId = Integer.parseInt(data.get("toUserId").toString());
                    Integer contestId = Integer.parseInt(data.get("contestId").toString());

                    // Mark as disqualified in DB
                    var participantOpt = participantRepository.findByContestIdAndUserId(contestId, toUserId);
                    if (participantOpt.isPresent()) {
                        var p = participantOpt.get();
                        p.setStatus(com.codegym.spring_boot.entity.enums.ParticipantStatus.DISQUALIFIED);
                        participantRepository.save(p);
                        log.info("Moderator {} kicked User {} from contest {}", userId, toUserId, contestId);

                        String targetRoom = "user_" + toUserId;
                        server.getRoomOperations(targetRoom).sendEvent("kick-contest", "Bạn đã bị truất quyền thi bởi Moderator.");
                    }
                } catch (Exception e) {
                    log.error("Error in moderator-kick-participant", e);
                }
            }
        });

        return server;
    }

//    private final com.codegym.spring_boot.service.IChatService chatService;

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
