import axiosClient from '../../../shared/services/axiosClient';

export interface TagDTO {
    id: number;
    name: string;
}

export interface ProblemResponseDTO {
    id: number;
    title: string;
    slug: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    timeLimit: number;
    memoryLimit: number;
    testcaseStatus: 'ready' | 'not_uploaded';
    tags: TagDTO[];
}

export const problemApi = {
    getProblems: async (): Promise<ProblemResponseDTO[]> => {
        return await axiosClient.get('/problems');
    },

    getDifficulties: async (): Promise<string[]> => {
        return await axiosClient.get('/problems/difficulties');
    },
    
    getProblemById: async (id: number): Promise<ProblemResponseDTO> => {
        return await axiosClient.get(`/problems/${id}`);
    },

    deleteProblem: async (id: number): Promise<void> => {
        return await axiosClient.delete(`/problems/${id}`);
    }
};
