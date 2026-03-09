package com.codegym.spring_boot.dto.chat.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SocketChatMessageRequest {
    private Integer contestId;
    private String content;
}
