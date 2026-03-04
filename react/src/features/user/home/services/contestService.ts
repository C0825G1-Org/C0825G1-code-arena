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
    firstProblemId?: number;
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
    },
    finishContest: async (id: number, status?: string): Promise<void> => {
        await axiosClient.post(`/contests/${id}/finish`, null, {
            params: status ? { status } : {}
        });
    },
    reportViolation: async (id: number): Promise<any> => {
        // axiosClient interceptor đã unwrap response.data sẵn, không gọi thêm .data nữa
        return axiosClient.post(`/contests/${id}/violation`);
    }
};
