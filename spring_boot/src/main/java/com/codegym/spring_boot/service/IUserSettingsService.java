package com.codegym.spring_boot.service;

import com.codegym.spring_boot.dto.user.request.ChangePasswordRequest;
import com.codegym.spring_boot.dto.user.request.UpdateProfileRequest;
import com.codegym.spring_boot.dto.user.response.UserProfileResponse;
import com.codegym.spring_boot.entity.User;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

public interface IUserSettingsService {
    UserProfileResponse getUserProfile(User user);

    UserProfileResponse updateProfile(User user, UpdateProfileRequest request);

    String uploadAvatar(User user, MultipartFile file) throws IOException;

    void changePassword(User user, ChangePasswordRequest request);

    UserProfileResponse getUserProfileById(Integer userId);
}
