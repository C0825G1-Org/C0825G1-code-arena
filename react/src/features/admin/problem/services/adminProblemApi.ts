import axiosClient from '../../../../shared/services/axiosClient';

export interface TagDTO {
    id: number;
    name: string;
}

export interface AdminProblemResponseDTO {
    id: number;
    title: string;
    slug: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    timeLimit: number;
    memoryLimit: number;
    testcaseStatus: 'ready' | 'not_uploaded';
    tags: TagDTO[];
    authorId?: number;
    authorUsername?: string;
    authorName?: string;
}

export const adminProblemApi = {
    getProblems: async (): Promise<AdminProblemResponseDTO[]> => {
        return await axiosClient.get('/problems?manage=true');
    },

    deleteProblem: async (id: number): Promise<void> => {
        return await axiosClient.delete(`/problems/${id}`);
    }
};
