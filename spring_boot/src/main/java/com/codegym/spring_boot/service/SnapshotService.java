package com.codegym.spring_boot.service;

import com.codegym.spring_boot.entity.Contest;
import com.codegym.spring_boot.entity.ContestSnapshot;
import com.codegym.spring_boot.entity.User;
import com.codegym.spring_boot.repository.ContestRepository;
import com.codegym.spring_boot.repository.ContestSnapshotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SnapshotService {
    private final ContestSnapshotRepository snapshotRepository;
    private final ContestRepository contestRepository;

    @Value("${app.upload.dir:uploads/snapshots}")
    private String uploadDir;

    @Transactional
    public void saveSnapshot(Integer contestId, User user, MultipartFile file) throws IOException {
        if (contestId == null)
            throw new IllegalArgumentException("Contest ID is null");
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new IllegalArgumentException("Cuộc thi không tồn tại."));

        // Tạo thư mục nếu chưa có
        Path root = Paths.get(uploadDir);
        if (!Files.exists(root)) {
            Files.createDirectories(root);
        }

        // Tạo tên file duy nhất (.jpg)
        String fileName = String.format("snapshot_%d_%d_%s.jpg",
                contestId, user.getId(), UUID.randomUUID().toString().substring(0, 8));

        Path filePath = root.resolve(fileName);
        Files.copy(file.getInputStream(), filePath);

        // Lưu vào DB
        ContestSnapshot snapshot = ContestSnapshot.builder()
                .contest(contest)
                .user(user)
                .fileName(fileName)
                .filePath(filePath.toString())
                .build();

        snapshotRepository.save(snapshot);
        log.debug("Saved camera snapshot from user {} in contest {}", user.getUsername(), contestId);
    }

    @Transactional(readOnly = true)
    public java.util.List<ContestSnapshot> getSnapshotsByContestAndUser(Integer contestId, Integer userId) {
        return snapshotRepository.findAllByContestIdAndUserId(contestId, userId);
    }
}
