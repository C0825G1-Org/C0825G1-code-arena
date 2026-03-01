package com.codegym.spring_boot.service;

import com.codegym.spring_boot.dto.SubmissionResultDTO;
import com.corundumstudio.socketio.SocketIOServer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final SocketIOServer socketIOServer;

    public void sendSubmissionUpdate(Long userId, SubmissionResultDTO dto) {
        String roomName = "user_" + userId;
        log.info("Sending submission update to room: {} with status: {}", roomName, dto.getStatus());
        socketIOServer.getRoomOperations(roomName)
                .sendEvent("submission_update", dto);
    }
}
