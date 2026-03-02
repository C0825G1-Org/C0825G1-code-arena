package com.codegym.spring_boot.scheduler;

import com.codegym.spring_boot.entity.Contest;
import com.codegym.spring_boot.entity.enums.ContestStatus;
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

    private final Map<Integer, ScheduledFuture<?>> startTasks = new ConcurrentHashMap<>();
    private final Map<Integer, ScheduledFuture<?>> endTasks = new ConcurrentHashMap<>();

    @PostConstruct
    public void initSchedules() {
        log.info("Loading contests for WebSocket event scheduling...");
        
        // Schedule start events for upcoming contests
        List<Contest> upcomingContests = contestRepository.findByStatus(ContestStatus.upcoming);
        for (Contest contest : upcomingContests) {
            scheduleContestStartEvent(contest.getId(), contest.getStartTime());
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
}
