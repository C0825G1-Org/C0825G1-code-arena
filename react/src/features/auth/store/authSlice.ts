import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface User {
    id: number;
    username: string;
    fullName: string;
    email: string;
    role: string;
    avatarUrl?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
}

const initialState: AuthState = {
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),
};

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        loginSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.isAuthenticated = true;
            localStorage.setItem('user', JSON.stringify(action.payload.user));
            localStorage.setItem('token', action.payload.token);
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        },
    },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
