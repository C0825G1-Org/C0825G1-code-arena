import axiosClient from '../../../../shared/services/axiosClient';

// DTO từ backend
export interface LeaderboardProblemDetail {
    problemId: number;
    isAccepted: boolean;
    failedAttempts: number;
    solvedTimeMinutes: number;
    score: number;         // Điểm thực tế (tổng scoreWeight các test pass)
    maxScore: number;      // Tổng scoreWeight tối đa của bài
    penaltyMinutes: number;// Penalty ICPC = solvedTimeMinutes + failedAttempts * 20
}

export interface LeaderboardDTO {
    rank: number;
    userId: number;
    username: string;
    fullName: string;
    avatarUrl?: string;
    totalScore: number;   // = tổng điểm thực tế từ các bài đã AC
    totalPenalty: number; // = tổng penalty phút (ranking key tie-breaker)
    totalSolved: number;  // = số bài AC
    hasScorePenalty?: boolean; // Added
    status?: 'JOINED' | 'FINISHED' | 'DISQUALIFIED'; // Added
    globalRating?: number; // Added
    problemDetails: LeaderboardProblemDetail[];
}

const API_URL = '/api/contests';


export const leaderboardApiService = {
    getLeaderboard: async (contestId: number): Promise<LeaderboardDTO[]> => {
        // Sử dụng axiosClient thay vì axios hardcode (auth interceptor + base URL)
        return axiosClient.get(`/contests/${contestId}/leaderboard`);
    }
};
