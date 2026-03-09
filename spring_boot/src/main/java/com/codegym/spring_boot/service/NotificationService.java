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

    public void sendToMonitor(Integer contestId,
            com.codegym.spring_boot.dto.moderator.response.MonitorDashboardResponse.MonitorSubmissionLog logEntry) {
        if (contestId != null) {
            String monitorRoom = "contest_monitor_" + contestId;
            log.info("Sending live submission log to room: {}", monitorRoom);
            socketIOServer.getRoomOperations(monitorRoom)
                    .sendEvent("monitor_submission_update", logEntry);
        }
    }

    public void sendLeaderboardUpdateToMonitor(Integer contestId,
            java.util.List<com.codegym.spring_boot.dto.moderator.response.MonitorDashboardResponse.MonitorLeaderboardEntry> leaderboardRows) {
        if (contestId != null) {
            String monitorRoom = "contest_monitor_" + contestId;
            log.info("Sending live leaderboard update to room: {}", monitorRoom);
            socketIOServer.getRoomOperations(monitorRoom)
                    .sendEvent("monitor_leaderboard_update", leaderboardRows);
        }
    }

    public void sendNewParticipantToMonitor(Integer contestId) {
        if (contestId != null) {
            String monitorRoom = "contest_monitor_" + contestId;
            log.info("Sending live new participant update to room: {}", monitorRoom);
            socketIOServer.getRoomOperations(monitorRoom)
                    .sendEvent("monitor_new_participant");
        }
    }

    public void sendUserLockUpdate(Integer userId, String type, boolean locked) {
        String roomName = "user_" + userId;
        log.info("Sending user lock update to room: {} | type: {} | locked: {}", roomName, type, locked);
        java.util.Map<String, Object> data = new java.util.HashMap<>();
        data.put("type", type);
        data.put("locked", locked);
        socketIOServer.getRoomOperations(roomName)
                .sendEvent("user_lock_update", data);
    }
}
