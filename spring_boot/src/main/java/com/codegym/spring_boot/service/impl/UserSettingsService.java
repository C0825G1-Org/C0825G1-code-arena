package com.codegym.spring_boot.service.impl;

import com.codegym.spring_boot.dto.user.request.ChangePasswordRequest;
import com.codegym.spring_boot.dto.user.request.UpdateProfileRequest;
import com.codegym.spring_boot.dto.user.response.UserProfileResponse;
import com.codegym.spring_boot.entity.Profile;
import com.codegym.spring_boot.entity.User;
import com.codegym.spring_boot.repository.ProfileRepository;
import com.codegym.spring_boot.repository.UserRepository;
import com.codegym.spring_boot.service.CloudinaryService;
import com.codegym.spring_boot.service.IUserSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserSettingsService implements IUserSettingsService {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final CloudinaryService cloudinaryService;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserProfileResponse getUserProfile(User user) {
        Profile profile = user.getProfile();
        return UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .avatarUrl(profile != null ? profile.getAvatarUrl() : null)
                .bio(profile != null ? profile.getBio() : null)
                .githubLink(profile != null ? profile.getGithubLink() : null)
                .createdAt(user.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public UserProfileResponse updateProfile(User user, UpdateProfileRequest request) {
        user.setFullName(request.getFullName());
        userRepository.save(user);

        Profile profile = user.getProfile();
        if (profile == null) {
            profile = new Profile();
            profile.setUser(user);
        }
        profile.setBio(request.getBio());
        profile.setGithubLink(request.getGithubLink());
        profileRepository.save(profile);

        return getUserProfile(user);
    }

    @Override
    @Transactional
    public String uploadAvatar(User user, MultipartFile file) throws IOException {
        String publicId = "avatars/" + user.getId() + "_" + UUID.randomUUID().toString();
        Map<String, Object> uploadResult = cloudinaryService.upload(file, "codearena/avatars", publicId);
        String avatarUrl = uploadResult.get("secure_url").toString();

        Profile profile = user.getProfile();
        if (profile == null) {
            profile = new Profile();
            profile.setUser(user);
        }
        profile.setAvatarUrl(avatarUrl);
        profileRepository.save(profile);

        return avatarUrl;
    }

    @Override
    @Transactional
    public void changePassword(User user, ChangePasswordRequest request) {
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new RuntimeException("Mật khẩu cũ không chính xác");
        }
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Mật khẩu xác nhận không khớp");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}
