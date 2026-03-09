import axiosInstance from '../../../shared/services/axiosClient';

export interface ChatMessage {
    id: string;
    contestId: number;
    senderId: number;
    senderName: string;
    senderAvatar: string | null;
    content: string;
    timestamp: string;
    isSystem: boolean;
}

const CHAT_API_URL = '/chat';

export const chatService = {
    getHistory: async (contestId: number): Promise<ChatMessage[]> => {
        const response: any = await axiosInstance.get(`${CHAT_API_URL}/${contestId}/history`);
        return response; // axiosClient interceptor đã trả về response.data rồi
    }
};
