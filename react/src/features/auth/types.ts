export interface LoginRequest {
    username: string;
    password?: string;
}

export interface RegisterRequest {
    username: string;
    fullName: string;
    email: string;
    password?: string;
}

export interface AuthResponse {
    token: string;
    id: number;
    username: string;
    fullName: string;
    email: string;
    role: string;
    avatarUrl?: string;
    avatarFrame?: string | null;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface VerifyOtpRequest {
    email: string;
    otp: string;
}

export interface ResetPasswordRequest {
    email: string;
    otp: string;
    newPassword: string;
}

export interface MessageResponse {
    message: string;
}
