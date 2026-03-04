import axiosClient from '../../../../shared/services/axiosClient';
import { ContestListItem } from '../../../user/home/services/contestService';

export interface HourlySubmissionDTO {
    hour: string;
    total: number;
}

export interface VerdictStatsDTO {
    name: string;
    value: number;
    color: string;
}

export interface ModeratorDashboardStats {
    totalParticipants: number;
    totalContests: number;
    submissionsLast24h: number;
    pendingProblems: number;
    activeContests: ContestListItem[];
    submissionTrend: HourlySubmissionDTO[];
    verdictStats: VerdictStatsDTO[];
}

export const moderatorDashboardService = {
    getDashboardStats: async (): Promise<ModeratorDashboardStats> => {
        const response = await axiosClient.get<ModeratorDashboardStats>('/moderator/dashboard/stats');
        return response as unknown as ModeratorDashboardStats;
    },
    getTrend: async (range: string = '24h'): Promise<HourlySubmissionDTO[]> => {
        const response = await axiosClient.get<HourlySubmissionDTO[]>(`/moderator/dashboard/trend?range=${range}`);
        return response as unknown as HourlySubmissionDTO[];
    },
    getTrendByRange: async (from: string, to: string): Promise<HourlySubmissionDTO[]> => {
        const response = await axiosClient.get<HourlySubmissionDTO[]>(`/moderator/dashboard/trend/custom?from=${from}&to=${to}`);
        return response as unknown as HourlySubmissionDTO[];
    }
};
