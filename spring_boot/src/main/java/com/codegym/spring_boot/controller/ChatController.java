package com.codegym.spring_boot.controller;

import com.codegym.spring_boot.dto.chat.request.ChatMessageRequest;
import com.codegym.spring_boot.entity.User;
import com.codegym.spring_boot.entity.mongo.ChatMessage;
import com.codegym.spring_boot.service.IChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {
    private final IChatService chatService;

    @GetMapping("/{contestId}/history")
    public ResponseEntity<List<ChatMessage>> getChatHistory(@PathVariable Integer contestId) {
        System.out.println("[API] Fetching chat history for contest: " + contestId);
        return ResponseEntity.ok(chatService.getChatHistory(contestId));
    }

    @PostMapping("/{contestId}/messages")
    public ResponseEntity<ChatMessage> sendMessage(
            @PathVariable Integer contestId,
            @RequestBody ChatMessageRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(chatService.saveMessage(contestId, user.getId(), request.getContent()));
    }
}
