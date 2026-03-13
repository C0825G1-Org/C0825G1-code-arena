package com.codegym.spring_boot.service.impl;

import com.codegym.spring_boot.entity.Contest;
import com.codegym.spring_boot.entity.User;
import com.codegym.spring_boot.entity.mongo.ChatMessage;
import com.codegym.spring_boot.repository.ContestParticipantRepository;
import com.codegym.spring_boot.repository.ContestRepository;
import com.codegym.spring_boot.repository.UserRepository;
import com.codegym.spring_boot.repository.mongo.ChatMessageRepository;
import com.codegym.spring_boot.service.IChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService implements IChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final ContestRepository contestRepository;
    private final ContestParticipantRepository contestParticipantRepository;
    private final UserRepository userRepository;

    @Override
    public com.codegym.spring_boot.entity.mongo.ChatMessage saveMessage(Integer contestId, Integer userId, String content) {
        if (!canUserChat(contestId, userId)) {
            throw new RuntimeException("Bạn không có quyền chat trong cuộc thi này hoặc thời gian chat đã hết.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));

        ChatMessage message = ChatMessage.builder()
                .contestId(contestId)
                .senderId(userId)
                .senderName(user.getFullName() != null ? user.getFullName() : user.getUsername())
                .senderAvatar(user.getProfile() != null ? user.getProfile().getAvatarUrl() : null)
                .senderAvatarFrame(user.getProfile() != null ? user.getProfile().getAvatarFrame() : null)
                .content(content)
                .timestamp(LocalDateTime.now())
                .isSystem(false)
                .userIsChatLocked(user.getIsContestChatLocked())
                .senderGlobalRating(user.getGlobalRating())
                .build();

        return chatMessageRepository.save(message);
    }

    @Override
    public List<Object> getChatHistory(Integer contestId) {
        List<com.codegym.spring_boot.entity.mongo.ChatMessage> messages = chatMessageRepository.findByContestIdOrderByTimestampAsc(contestId);

        // Gom các senderId duy nhất để lấy thông tin mới nhất (tránh N+1)
        java.util.Set<Integer> userIds = messages.stream()
                .filter(m -> m.getSenderId() != null)
                .map(com.codegym.spring_boot.entity.mongo.ChatMessage::getSenderId)
                .collect(java.util.stream.Collectors.toSet());

        if (!userIds.isEmpty()) {
            java.util.Map<Integer, User> userMap = userRepository.findAllById(userIds).stream()
                    .collect(java.util.stream.Collectors.toMap(User::getId, u -> u));

            messages.forEach(m -> {
                User u = userMap.get(m.getSenderId());
                if (u != null && u.getProfile() != null) {
                    // Ghi đè thông tin cũ bằng thông tin mới nhất từ Database
                    m.setSenderAvatar(u.getProfile().getAvatarUrl());
                    m.setSenderAvatarFrame(u.getProfile().getAvatarFrame());
                    // Cập nhật cả thông tin Rating và tên nếu cần (để đồng bộ)
                    m.setSenderName(u.getFullName() != null ? u.getFullName() : u.getUsername());
                    m.setSenderGlobalRating(u.getGlobalRating());
                }
            });
        }

        return messages.stream().map(m -> (Object) m).collect(java.util.stream.Collectors.toList());
    }

    @Override
    public boolean canUserChat(Integer contestId, Integer userId) {
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new RuntimeException("Cuộc thi không tồn tại"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));

        if (user.getRole() == com.codegym.spring_boot.entity.enums.UserRole.admin
                || user.getRole() == com.codegym.spring_boot.entity.enums.UserRole.moderator) {
            return true;
        }

        if (Boolean.TRUE.equals(user.getIsContestChatLocked())) {
            return false;
        }

        // Người tạo cuộc thi luôn có quyền chat
        if (contest.getCreatedBy() != null && contest.getCreatedBy().getId().equals(userId)) {
            return true;
        }

        // Kiểm tra xem user có là thí sinh tham gia không
        boolean isParticipant = contestParticipantRepository.findByContestIdAndUserId(contestId, userId).isPresent();

        return isParticipant && isWithinChatTime(contest);
    }

    private boolean isWithinChatTime(Contest contest) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startTime = contest.getStartTime();
        LocalDateTime endTime = contest.getEndTime();

        // Không cho phép chat trong thời gian thi diễn ra (để tránh gian lận)
        if (!now.isBefore(startTime) && !now.isAfter(endTime)) {
            return false;
        }

        // Chat được phép từ lúc trước thi cho đến 15 phút sau khi kết thúc
        LocalDateTime chatDeadline = endTime.plusMinutes(15);
        return now.isBefore(chatDeadline);
    }
}
