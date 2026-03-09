package com.codegym.spring_boot.service;

import com.codegym.spring_boot.entity.Contest;
import com.codegym.spring_boot.entity.ContestSnapshot;
import com.codegym.spring_boot.entity.User;
import com.codegym.spring_boot.repository.ContestRepository;
import com.codegym.spring_boot.repository.ContestSnapshotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SnapshotService {
    private final ContestSnapshotRepository snapshotRepository;
    private final ContestRepository contestRepository;
    private final CloudinaryService cloudinaryService;

    @Transactional
    public void saveSnapshot(Integer contestId, User user, MultipartFile file) throws IOException {
        if (contestId == null)
            throw new IllegalArgumentException("Contest ID is null");
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new IllegalArgumentException("Cuộc thi không tồn tại."));

        // Tạo public_id duy nhất
        String publicId = String.format("snapshot_%d_%d_%s",
                contestId, user.getId(), UUID.randomUUID().toString().substring(0, 8));

        // Upload lên Cloudinary
        Map<String, Object> uploadResult = cloudinaryService.upload(file, "code_arena_snapshots", publicId);
        String secureUrl = (String) uploadResult.get("secure_url");
        String finalPublicId = (String) uploadResult.get("public_id");

        // Lưu vào DB
        ContestSnapshot snapshot = ContestSnapshot.builder()
                .contest(contest)
                .user(user)
                .fileName(finalPublicId) // Lưu public_id vào fileName để dùng cho việc xóa sau này
                .filePath(secureUrl) // Lưu link ảnh (secure_url) vào filePath
                .build();

        snapshotRepository.save(snapshot);
        log.debug("Saved camera snapshot from user {} in contest {} via Cloudinary", user.getUsername(), contestId);
    }

    @Transactional(readOnly = true)
    public java.util.List<ContestSnapshot> getSnapshotsByContestAndUser(Integer contestId, Integer userId) {
        return snapshotRepository.findAllByContestIdAndUserId(contestId, userId);
    }
}
