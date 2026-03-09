import axiosInstance from '../../../../shared/services/axiosClient';

export interface UserStats {
    eloRanking: number;
    topPercent: number;
    solvedCount: number;
    acRate: number;
    streak: number;
}

export interface RecentSubmission {
    id: number;
    problemTitle: string;
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
    bio?: string;
    githubLink?: string;
    createdAt?: string; // ISO String
}

export const profileService = {
    // Basic profile info
    getUserProfile: async (): Promise<UserProfileResponse> => {
        return axiosInstance.get('/users/settings/profile');
    },

    // Basic stats
    getUserStats: async (): Promise<UserStats> => {
        return axiosInstance.get('/user-dashboard/stats');
    },

    // Recent submissions
    getRecentSubmissions: async (limit: number = 10): Promise<RecentSubmission[]> => {
        return axiosInstance.get(`/user-dashboard/submissions/recent?limit=${limit}`);
    },

    // Recent contests
    getRecentContests: async (limit: number = 10): Promise<RecentContest[]> => {
        return axiosInstance.get(`/user-dashboard/contests/recent?limit=${limit}`);
    },

    // Submission Status Stats for Doughnut chart
    getSubmissionStatusStats: async (): Promise<SubmissionStatusStat[]> => {
        return axiosInstance.get('/user-dashboard/submissions/stats');
    },

    // Activity heatmap
    getActivityHeatmap: async (days: number = 30): Promise<HeatmapData[]> => {
        return axiosInstance.get(`/user-dashboard/submissions/heatmap?days=${days}`);
    }
};
