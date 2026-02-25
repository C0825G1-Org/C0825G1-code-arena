import axiosClient from '../../../shared/services/axiosClient';
import { LoginRequest, RegisterRequest, AuthResponse, ForgotPasswordRequest, VerifyOtpRequest, ResetPasswordRequest, MessageResponse } from '../types';

export const authService = {
    login: async (data: LoginRequest): Promise<AuthResponse> => {
        return axiosClient.post('/auth/login', data);
    },

    register: async (data: RegisterRequest): Promise<AuthResponse> => {
        return axiosClient.post('/auth/register', data);
    },

    forgotPassword: async (data: ForgotPasswordRequest): Promise<MessageResponse> => {
        return axiosClient.post('/auth/forgot-password', data);
    },

    verifyOtp: async (data: VerifyOtpRequest): Promise<MessageResponse> => {
        return axiosClient.post('/auth/verify-otp', data);
    },

    resetPassword: async (data: ResetPasswordRequest): Promise<MessageResponse> => {
        return axiosClient.post('/auth/reset-password', data);
    }
};
