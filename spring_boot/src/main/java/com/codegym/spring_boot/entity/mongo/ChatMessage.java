package com.codegym.spring_boot.entity.mongo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "chat_messages")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {
    @Id
    private String id;
    private Integer contestId;
    private Integer senderId;
    private String senderName;
    private String senderAvatar;
    private String senderAvatarFrame;
    private String content;
    private LocalDateTime timestamp;
    private boolean isSystem;
    private Boolean userIsChatLocked;
    private Integer senderGlobalRating;
}
