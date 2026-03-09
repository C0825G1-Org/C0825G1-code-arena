import axiosClient from '../../../../shared/services/axiosClient';

export interface AdminTagDTO {
    id: number;
    name: string;
    // We might need to mock or add logic for count/colors since backend TagDTO only has id, name
    count?: number; 
    colorClass?: string;
    bgClass?: string;
    borderClass?: string;
}

export const adminTagApi = {
    // API returns List<TagDTO>, not PagedResponse
    getAllTags: async (): Promise<AdminTagDTO[]> => {
        return axiosClient.get<any, AdminTagDTO[]>('/tags');
    },

    createTag: async (data: { name: string }): Promise<AdminTagDTO> => {
        return axiosClient.post<any, AdminTagDTO>('/tags', data);
    },

    updateTag: async (id: number, data: { name: string }): Promise<AdminTagDTO> => {
        return axiosClient.put<any, AdminTagDTO>(`/tags/${id}`, data);
    },

    deleteTag: async (id: number): Promise<void> => {
        return axiosClient.delete<any, void>(`/tags/${id}`);
    }
};
