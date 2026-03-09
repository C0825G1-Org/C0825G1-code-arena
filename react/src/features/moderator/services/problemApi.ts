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
    authorId?: number;
}
export interface ProblemUserDTO extends ProblemResponseDTO {
    userStatus?: string;
}
export interface ProblemRequestDTO {
    title: string;
    slug: string;
    description: string;
    difficulty: string;
    timeLimit: number;
    memoryLimit: number;
    tagIds: number[];
}

export const problemApi = {
    getProblems: async (): Promise<ProblemResponseDTO[]> => {
        return await axiosClient.get('/problems');
    },

    getDifficulties: async (): Promise<string[]> => {
        return await axiosClient.get('/problems/difficulties');
    },

    getTags: async (): Promise<TagDTO[]> => {
        return await axiosClient.get('/tags');
    },
    
    getProblemById: async (id: number): Promise<ProblemResponseDTO> => {
        return await axiosClient.get(`/problems/${id}`);
    },

    createProblem: async (data: ProblemRequestDTO): Promise<ProblemResponseDTO> => {
        return await axiosClient.post('/problems', data);
    },

    updateProblem: async (id: number, data: ProblemRequestDTO): Promise<ProblemResponseDTO> => {
        return await axiosClient.put(`/problems/${id}`, data);
    },

    deleteProblem: async (id: number): Promise<void> => {
        return await axiosClient.delete(`/problems/${id}`);
    }
};
