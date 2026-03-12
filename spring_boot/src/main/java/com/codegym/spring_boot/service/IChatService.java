package com.codegym.spring_boot.service;

import com.codegym.spring_boot.entity.mongo.ChatMessage;
import java.util.List;

public interface IChatService {
    Object saveMessage(Integer contestId, Integer userId, String content);

    java.util.List<Object> getChatHistory(Integer contestId);

    boolean canUserChat(Integer contestId, Integer userId);
}
