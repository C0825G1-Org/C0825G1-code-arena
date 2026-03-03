import axiosClient from '../../../../shared/services/axiosClient';
import { ContestListItem } from '../../../user/home/services/contestService';

export interface ModeratorDashboardStats {
    totalParticipants: number;
    totalContests: number;
    submissionsLast24h: number;
    pendingProblems: number;
    activeContests: ContestListItem[];
}

export const moderatorDashboardService = {
    getDashboardStats: async (): Promise<ModeratorDashboardStats> => {
        const response = await axiosClient.get<ModeratorDashboardStats>('/moderator/dashboard/stats');
        return response as unknown as ModeratorDashboardStats;
    }
};
