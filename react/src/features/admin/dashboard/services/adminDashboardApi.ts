    import axiosClient from '../../../../shared/services/axiosClient';

export interface HourlySubmissionDTO {
    hour: string;
    total: number;
}

export interface VerdictStatsDTO {
    name: string;
    value: number;
    color: string;
}

export interface ActiveContestDTO {
    id: number;
    title: string;
    status: 'active' | 'upcoming';
    startTime: string;   // ISO datetime string
    endTime: string;
    participants: number;
    problems: number;
}

export interface AdminDashboardStatsDTO {
    totalUsers: number;
    totalProblems: number;
    totalSubmissions: number;
    activeLanguages: number;
    totalLanguages: number;
    submissionTrend: HourlySubmissionDTO[];
    verdictStats: VerdictStatsDTO[];
    activeContests: ActiveContestDTO[];
}

export const adminDashboardApi = {
    getStats: async (): Promise<AdminDashboardStatsDTO> => {
        return await axiosClient.get('/admin/dashboard/stats');
    },
    getTrend: async (range: string): Promise<HourlySubmissionDTO[]> => {
        return await axiosClient.get(`/admin/dashboard/submission-trend?range=${range}`);
    },
    getTrendByRange: async (from: string, to: string): Promise<HourlySubmissionDTO[]> => {
        return await axiosClient.get(`/admin/dashboard/submission-trend/range?from=${from}&to=${to}`);
    },
};
