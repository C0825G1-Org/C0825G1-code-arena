import axiosInstance from '../../../../shared/services/axiosClient';

export interface UserProfileResponse {
    id: number;
    username: string;
    fullName: string | null;
    email: string;
    avatarUrl: string | null;
    bio: string | null;
    githubLink: string | null;
}

export interface UpdateProfileRequest {
    fullName: string;
    bio: string | null;
    githubLink: string | null;
}

export interface ChangePasswordRequest {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
}

const SETTINGS_API_URL = '/users/settings';

export const settingsService = {
    getProfile: async (): Promise<UserProfileResponse> => {
        return axiosInstance.get(`${SETTINGS_API_URL}/profile`);
    },

    updateProfile: async (data: UpdateProfileRequest): Promise<UserProfileResponse> => {
        return axiosInstance.put(`${SETTINGS_API_URL}/profile`, data);
    },

    uploadAvatar: async (file: File): Promise<{ avatarUrl: string }> => {
        const formData = new FormData();
        formData.append('file', file);
        return axiosInstance.post(`${SETTINGS_API_URL}/avatar`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    changePassword: async (data: ChangePasswordRequest): Promise<{ message: string }> => {
        return axiosInstance.put(`${SETTINGS_API_URL}/password`, data);
    }
};
