package com.codegym.spring_boot.scheduler;

import com.codegym.spring_boot.entity.Contest;
import com.codegym.spring_boot.entity.enums.ContestStatus;
import com.codegym.spring_boot.repository.ContestParticipantRepository;
import com.codegym.spring_boot.repository.ContestRepository;
import com.corundumstudio.socketio.SocketIOServer;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;

@Component
@RequiredArgsConstructor
@Slf4j
public class ContestEventScheduler {

    private final TaskScheduler taskScheduler;
    private final SocketIOServer socketIOServer;
    private final ContestRepository contestRepository;
    private final ContestParticipantRepository contestParticipantRepository;

    private final Map<Integer, ScheduledFuture<?>> startTasks = new ConcurrentHashMap<>();
    private final Map<Integer, ScheduledFuture<?>> endTasks = new ConcurrentHashMap<>();
    private final Map<Integer, List<ScheduledFuture<?>>> reminderTasks = new ConcurrentHashMap<>();

    @PostConstruct
    public void initSchedules() {
        log.info("Loading contests for WebSocket event scheduling...");
        
        // Schedule start events for upcoming contests
        List<Contest> upcomingContests = contestRepository.findByStatus(ContestStatus.upcoming);
        for (Contest contest : upcomingContests) {
            scheduleContestStartEvent(contest.getId(), contest.getStartTime());
            // Lên lịch nhắc nhở cho từng user đã đăng ký
            List<Integer> participantIds = contestParticipantRepository
                    .findByIdContestId(contest.getId())
                    .stream()
                    .map(cp -> cp.getId().getUserId())
                    .toList();
            scheduleContestReminder(
                    contest.getId(),
                    contest.getTitle(),
                    contest.getStartTime(),
                    participantIds
            );
        }

        // Schedule end events for active contests
        List<Contest> activeContests = contestRepository.findByStatus(ContestStatus.active);
        for (Contest contest : activeContests) {
            scheduleContestEndEvent(contest.getId(), contest.getEndTime());
        }
    }

    public void scheduleContestStartEvent(Integer contestId, LocalDateTime startTime) {
        cancelStartSchedule(contestId);
        if (startTime == null) return;

        Date startDate = Date.from(startTime.atZone(ZoneId.systemDefault()).toInstant());
        if (startDate.before(new Date())) return;

        ScheduledFuture<?> future = taskScheduler.schedule(() -> {
            log.info("Pushing CONTEST_STARTED event for contestId {}", contestId);
            socketIOServer.getBroadcastOperations().sendEvent("contest_update", Map.of(
                    "contestId", contestId,
                    "event", "STARTED",
                    "status", "active"
            ));
            startTasks.remove(contestId);
        }, startDate);

        startTasks.put(contestId, future);
        log.info("Scheduled WebSocket start event for contestId {} at {}", contestId, startDate);
    }

    public void scheduleContestEndEvent(Integer contestId, LocalDateTime endTime) {
        cancelEndSchedule(contestId);
        if (endTime == null) return;

        Date endDate = Date.from(endTime.atZone(ZoneId.systemDefault()).toInstant());
        if (endDate.before(new Date())) return;

        ScheduledFuture<?> future = taskScheduler.schedule(() -> {
            log.info("Pushing CONTEST_FINISHED event for contestId {}", contestId);
            socketIOServer.getBroadcastOperations().sendEvent("contest_update", Map.of(
                    "contestId", contestId,
                    "event", "FINISHED",
                    "status", "finished"
            ));
            endTasks.remove(contestId);
        }, endDate);

        endTasks.put(contestId, future);
        log.info("Scheduled WebSocket end event for contestId {} at {}", contestId, endDate);
    }

    public void cancelAllSchedules(Integer contestId) {
        cancelStartSchedule(contestId);
        cancelEndSchedule(contestId);
        cancelReminderSchedules(contestId);
    }

    private void cancelStartSchedule(Integer contestId) {
        ScheduledFuture<?> existingTask = startTasks.remove(contestId);
        if (existingTask != null && !existingTask.isCancelled()) {
            existingTask.cancel(false);
        }
    }

    private void cancelEndSchedule(Integer contestId) {
        ScheduledFuture<?> existingTask = endTasks.remove(contestId);
        if (existingTask != null && !existingTask.isCancelled()) {
            existingTask.cancel(false);
        }
    }

    public void scheduleContestReminder(Integer contestId,
                                        String contestTitle,
                                        LocalDateTime startTime,
                                        List<Integer> participantUserIds) {
        cancelReminderSchedules(contestId);
        if (startTime == null) return;
        List<ScheduledFuture<?>> futures = new java.util.ArrayList<>();
        // Các mốc thời gian nhắc nhở (phút trước khi bắt đầu)
        int[] minutesBefore = {60, 30, 15, 5, 1};
        for (int minutes : minutesBefore) {
            LocalDateTime reminderTime = startTime.minusMinutes(minutes);
            Date reminderDate = Date.from(reminderTime.atZone(ZoneId.systemDefault()).toInstant());
            // Chỉ schedule nếu thời điểm nhắc nhở còn trong tương lai
            if (reminderDate.before(new Date())) continue;
            final int reminderMinutes = minutes;
            ScheduledFuture<?> future = taskScheduler.schedule(() -> {
                log.info("Pushing REMINDER event for contest [{}] - {} phút nữa", contestId, reminderMinutes);
                Map<String, Object> payload = new java.util.HashMap<>();
                payload.put("contestId", contestId);
                payload.put("contestTitle", contestTitle);
                payload.put("minutesLeft", reminderMinutes);
                payload.put("type", "REMINDER");
                // Chỉ gửi tới từng user đã đăng ký (gửi riêng tư qua room)
                for (Integer userId : participantUserIds) {
                    socketIOServer.getRoomOperations("user_" + userId)
                            .sendEvent("contest_reminder", payload);
                }
            }, reminderDate);
            futures.add(future);
            log.info("Đã lên lịch nhắc nhở contest [{}] trước {} phút (lúc {})",
                    contestId, minutes, reminderDate);
        }
        reminderTasks.put(contestId, futures);
    }

    private void cancelReminderSchedules(Integer contestId) {
        List<ScheduledFuture<?>> futures = reminderTasks.remove(contestId);
        if (futures != null) {
            futures.forEach(f -> { if (!f.isCancelled()) f.cancel(false); });
        }
    }
}
