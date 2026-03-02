import axios from 'axios';

// DTO from backend
export interface LeaderboardProblemDetail {
    problemId: number;
    isAccepted: boolean;
    failedAttempts: number;
    solvedTimeMinutes: number;
    score: number;
}

export interface LeaderboardDTO {
    rank: number;
    userId: number;
    username: string;
    fullName: string;
    totalScore: number;
    totalPenalty: number;
    totalSolved: number;
    problemDetails: LeaderboardProblemDetail[];
}

const API_URL = '/api/contests';

export const leaderboardApiService = {
    getLeaderboard: async (contestId: number): Promise<LeaderboardDTO[]> => {
        try {
            const tokenStr = localStorage.getItem('token');
            let token = '';
            if (tokenStr) {
                try {
                    const parsed = JSON.parse(tokenStr);
                    token = typeof parsed === 'string' ? parsed : (parsed.token || parsed.accessToken || '');
                } catch {
                    token = tokenStr;
                }
            }

            const response = await axios.get(`${API_URL}/${contestId}/leaderboard`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            throw error;
        }
    }
};
