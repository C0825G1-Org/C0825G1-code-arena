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
        // Fetch fresh user to ensure Profile is loaded (principal might be
        // detached/shallow)
        User freshUser = userRepository.findById(user.getId())
                .orElse(user);
        Profile profile = freshUser.getProfile();
        return UserProfileResponse.builder()
                .id(freshUser.getId())
                .username(freshUser.getUsername())
                .fullName(freshUser.getFullName())
                .email(freshUser.getEmail())
                .avatarUrl(profile != null ? profile.getAvatarUrl() : null)
                .bio(profile != null ? profile.getBio() : null)
                .githubLink(profile != null ? profile.getGithubLink() : null)
                .createdAt(freshUser.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public UserProfileResponse updateProfile(User user, UpdateProfileRequest request) {
        // Fetch fresh user from DB to ensure profile is linked
        User currentUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        currentUser.setFullName(request.getFullName());
        userRepository.save(currentUser);

        Profile profile = currentUser.getProfile();
        if (profile == null) {
            profile = new Profile();
            profile.setUser(currentUser);
            currentUser.setProfile(profile); // Ensure bidirectional consistency
        }
        profile.setBio(request.getBio());
        profile.setGithubLink(request.getGithubLink());
        profileRepository.save(profile);

        return getUserProfile(currentUser);
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
