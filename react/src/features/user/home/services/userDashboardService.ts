import axiosClient from '../../../../shared/services/axiosClient';

export interface UserStats {
    eloRanking: number;
    practiceRating: number;
    totalRating: number;
    topPercent: number;
    solvedCount: number;
    acRate: number;
    streak: number;
}

export interface TopCoder {
    userId: number;
    username: string;
    fullName: string;
    globalRating: number;
    practiceRating: number;
    totalRating: number;
    avatarUrl: string | null;
    avatarFrame?: string | null;
}

export const userDashboardService = {
    getUserStats: async (): Promise<UserStats> => {
        return axiosClient.get('/user-dashboard/stats');
    },

    getTopCoders: async (): Promise<TopCoder[]> => {
        return axiosClient.get('/user-dashboard/top-coders');
    }
};
