import axiosClient from '../../../../shared/services/axiosClient';

export interface LeaderboardUserResponse {
    rank: number;
    userId: number;
    username: string;
    fullName: string;
    email: string;
    globalRating: number;
    solvedCount: number;
    acRate: number;
    avatarUrl?: string;
    previousGlobalRating?: number;
}

export interface PageResponse<T> {
    content: T[];
    pageable: any;
    last: boolean;
    totalPages: number;
    totalElements: number;
    first: boolean;
    size: number;
    number: number;
    sort: any;
    numberOfElements: number;
    empty: boolean;
}

export const getLeaderboard = async (search: string, page: number, size: number): Promise<PageResponse<LeaderboardUserResponse>> => {
    const data = await axiosClient.get<any, PageResponse<LeaderboardUserResponse>>('/leaderboard', {
        params: { search, page, size }
    });
    return data;
};
