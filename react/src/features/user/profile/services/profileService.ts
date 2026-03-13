import axiosInstance from '../../../../shared/services/axiosClient';

export interface UserStats {
    eloRanking: number;
    practiceRating: number;
    totalRating: number;
    topPercent: number;
    solvedCount: number;
    acRate: number;
    streak: number;
}

export interface RecentSubmission {
    id: number;
    problemTitle: string;
    problemSlug: string;
    problemId: number;
    status: string;
    language: string;
    executionTime: number;
    memoryUsage: number;
    createdAt: string;
}

export interface RecentContest {
    contestId: number;
    title: string;
    totalScore: number;
    totalPenalty: number;
    status: string;
    startTime: string;
    endTime: string;
    joinedAt: string;
}

export interface SubmissionStatusStat {
    status: string;
    count: number;
}

export interface HeatmapData {
    date: string;
    count: number;
}

export interface UserProfileResponse {
    id: number;
    username: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
    avatarFrame?: string | null;
    bio?: string;
    githubLink?: string;
    createdAt?: string; // ISO String
}

export const profileService = {
    // Basic profile info
    getUserProfile: async (userId?: number | string): Promise<UserProfileResponse> => {
        if (userId) {
            return axiosInstance.get(`/users/${userId}/profile`);
        }
        return axiosInstance.get('/users/settings/profile');
    },

    // Basic stats
    getUserStats: async (userId?: number | string): Promise<UserStats> => {
        if (userId) {
            return axiosInstance.get(`/user-dashboard/stats/${userId}`);
        }
        return axiosInstance.get('/user-dashboard/stats');
    },

    // Recent submissions
    getRecentSubmissions: async (limit: number = 10, userId?: number | string): Promise<RecentSubmission[]> => {
        const url = userId
            ? `/user-dashboard/submissions/recent/${userId}?limit=${limit}`
            : `/user-dashboard/submissions/recent?limit=${limit}`;
        return axiosInstance.get(url);
    },

    // Recent contests
    getRecentContests: async (limit: number = 10, userId?: number | string): Promise<RecentContest[]> => {
        const url = userId
            ? `/user-dashboard/contests/recent/${userId}?limit=${limit}`
            : `/user-dashboard/contests/recent?limit=${limit}`;
        return axiosInstance.get(url);
    },

    // Submission Status Stats for Doughnut chart
    getSubmissionStatusStats: async (userId?: number | string): Promise<SubmissionStatusStat[]> => {
        if (userId) {
            return axiosInstance.get(`/user-dashboard/submissions/stats/${userId}`);
        }
        return axiosInstance.get('/user-dashboard/submissions/stats');
    },

    // Activity heatmap
    getActivityHeatmap: async (days: number = 30, userId?: number | string): Promise<HeatmapData[]> => {
        const url = userId
            ? `/user-dashboard/submissions/heatmap/${userId}?days=${days}`
            : `/user-dashboard/submissions/heatmap?days=${days}`;
        return axiosInstance.get(url);
    }
};
