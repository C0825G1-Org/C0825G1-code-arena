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
    getContests: async (status?: string, page = 0, size = 5): Promise<PageResponse<ContestListItem>> => {
        const params: any = { page, size };
        if (status) params.status = status;
        return axiosClient.get('/contests', { params });
    },
};
