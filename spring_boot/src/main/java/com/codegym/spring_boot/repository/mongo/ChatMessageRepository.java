package com.codegym.spring_boot.repository.mongo;

import com.codegym.spring_boot.entity.mongo.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {
    List<ChatMessage> findByContestIdOrderByTimestampAsc(Integer contestId);

    Page<ChatMessage> findByContestIdOrderByTimestampDesc(Integer contestId, Pageable pageable);
}
