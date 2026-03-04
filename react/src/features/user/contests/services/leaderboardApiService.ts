import axiosClient from '../../../../shared/services/axiosClient';

// DTO từ backend
export interface LeaderboardProblemDetail {
    problemId: number;
    isAccepted: boolean;
    failedAttempts: number;
    solvedTimeMinutes: number;
    score: number; // penalty của bài này = solvedTimeMinutes + 20 * failedAttempts
}

export interface LeaderboardDTO {
    rank: number;
    userId: number;
    username: string;
    fullName: string;
    avatarUrl?: string;
    totalScore: number;   // = số bài AC (ranking key 1: giảm dần)
    totalPenalty: number; // = tổng penalty phút (ranking key 2: tăng dần)
    totalSolved: number;  // = số bài AC (alias của totalScore)
    problemDetails: LeaderboardProblemDetail[];
}
export const leaderboardApiService = {
    getLeaderboard: async (contestId: number): Promise<LeaderboardDTO[]> => {
        // Sử dụng axiosClient thay vì axios hardcode (auth interceptor + base URL)
        return axiosClient.get(`/contests/${contestId}/leaderboard`);
    }
};
