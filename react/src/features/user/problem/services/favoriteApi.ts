import axiosClient from '../../../../shared/services/axiosClient';
import { ProblemUserDTO } from '../../../moderator/services/problemApi';

export interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    number: number;
    size: number;
}

export const favoriteApi = {
    toggleFavorite: async (problemId: number): Promise<{ isFavorited: boolean; message: string }> => {
        return await axiosClient.post(`/favorites/toggle/${problemId}`);
    },

    getMyFavoriteProblemIds: async (): Promise<number[]> => {
        return await axiosClient.get('/favorites/my-favorite-ids');
    },

    getMyFavoriteProblems: async (page: number = 0, size: number = 5): Promise<PageResponse<ProblemUserDTO>> => {
        return await axiosClient.get(`/favorites/my-favorites?page=${page}&size=${size}`);
    }
};
