package com.codegym.spring_boot.dto.chat.request;

import lombok.Data;

@Data
public class SocketChatMessageRequest {
    private Integer contestId;
    private String content;
}
