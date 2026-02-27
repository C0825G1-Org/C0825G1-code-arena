import axiosClient from '../../../../shared/services/axiosClient';

export interface ContestListItem {
    id: number;
    title: string;
    status: string;
    startTime: string;
    endTime: string;
    participantCount: number;
    serverTime: string;
    isRegistered: boolean;
}

interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
}

export const contestService = {
    getContests: async (params?: any): Promise<PageResponse<ContestListItem>> => {
        return axiosClient.get('/contests', { params: params || {} });
    },
    registerForContest: async (id: number): Promise<any> => {
        return axiosClient.post(`/contests/${id}/register`);
    },
    getContestDetail: async (id: number): Promise<any> => {
        return axiosClient.get(`/contests/${id}`);
    }
};
