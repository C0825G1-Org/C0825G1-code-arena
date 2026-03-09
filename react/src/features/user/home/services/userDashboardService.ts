import axiosClient from '../../../../shared/services/axiosClient';

export interface UserStats {
    eloRanking: number;
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
    avatarUrl?: string;
}

export const userDashboardService = {
    getUserStats: async (): Promise<UserStats> => {
        return axiosClient.get('/user-dashboard/stats');
    },

    getTopCoders: async (): Promise<TopCoder[]> => {
        return axiosClient.get('/user-dashboard/top-coders');
    }
};
