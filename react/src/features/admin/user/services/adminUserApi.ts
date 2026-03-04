import axiosClient from '../../../../shared/services/axiosClient';

export interface AdminUserDTO {
    id: number;
    username: string;
    fullName: string | null;
    email: string;
    role: 'user' | 'moderator' | 'admin';
    createdAt: string;
    isLocked: boolean;
}

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;   // current page (0-indexed)
    size: number;
}

export const adminUserApi = {
    getUsers: (
        search: string,
        role: string,
        page: number,
        size: number
    ): Promise<PageResponse<AdminUserDTO>> =>
        axiosClient.get(`/admin/users?search=${encodeURIComponent(search)}&role=${role}&page=${page}&size=${size}`),

    promote: (id: number): Promise<void> =>
        axiosClient.put(`/admin/users/${id}/promote`),

    demote: (id: number): Promise<void> =>
        axiosClient.put(`/admin/users/${id}/demote`),

    toggleLock: (id: number): Promise<void> =>
        axiosClient.put(`/admin/users/${id}/toggle-lock`),
};
