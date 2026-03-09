import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authService } from '../services/authService';
import { loginSuccess, logout as logoutAction } from '../store/authSlice';
import { LoginRequest, RegisterRequest } from '../types';

export interface UseAuthReturn {
    login: (data: LoginRequest) => Promise<void>;
    register: (data: RegisterRequest) => Promise<void>;
    logout: () => void;
    handleLoginSuccess: (response: { id: number, username: string, fullName: string, email: string, role: string, token: string, avatarUrl?: string }, message?: string) => void;
    isLoading: boolean;
}

export const useAuth = (): UseAuthReturn => {
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLoginSuccess = (response: { id: number, username: string, fullName: string, email: string, role: string, token: string, avatarUrl?: string }, message?: string) => {
        dispatch(loginSuccess({
            user: {
                id: response.id,
                username: response.username,
                fullName: response.fullName,
                email: response.email,
                role: response.role,
                avatarUrl: response.avatarUrl
            },
            token: response.token
        }));

        toast.success(message || `Welcome back, ${response.fullName}!`);

        // Ưu tiên quay lại trang cũ nếu có state.from
        const from = (location.state as any)?.from;
        if (from) {
            navigate(from, { replace: true });
            return;
        }

        // Chuyển hướng theo Role mặc định
        const userRole = response.role?.replace('ROLE_', '').toUpperCase() || '';
        if (userRole === 'ADMIN') {
            navigate('/admin/dashboard');
        } else if (userRole === 'MODERATOR') {
            navigate('/moderator/dashboard');
        } else {
            navigate('/home');
        }
    };

    const login = async (data: LoginRequest) => {
        setIsLoading(true);
        try {
            const response = await authService.login(data);
            handleLoginSuccess(response);
        } catch (error: any) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (data: RegisterRequest) => {
        setIsLoading(true);
        try {
            const response = await authService.register(data);
            handleLoginSuccess(response, `Chào mừng ${response.fullName} gia nhập Code Arena!`);
        } catch (error: any) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        dispatch(logoutAction());
        toast.info('Logged out successfully.');
        navigate('/login');
    };

    return { login, register, logout, handleLoginSuccess, isLoading };
};
