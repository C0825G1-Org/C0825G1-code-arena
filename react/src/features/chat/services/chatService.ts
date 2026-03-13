import axiosInstance from '../../../shared/services/axiosClient';

export interface ChatMessage {
    id: string;
    contestId: number;
    senderId: number;
    senderName: string;
    senderAvatar: string | null;
    senderAvatarFrame: string | null;
    content: string;
    timestamp: string;
    isSystem: boolean;
    userIsChatLocked?: boolean;
    senderGlobalRating?: number;
}

const CHAT_API_URL = '/chat';
const MODERATOR_API_URL = '/moderator/dashboard';

export const chatService = {
    getHistory: async (contestId: number): Promise<ChatMessage[]> => {
        const response: any = await axiosInstance.get(`${CHAT_API_URL}/${contestId}/history`);
        return response;
    },

    toggleUserLock: async (userId: number, type: 'chat' | 'discussion', locked: boolean): Promise<void> => {
        await axiosInstance.put(`${MODERATOR_API_URL}/users/${userId}/lock`, null, {
            params: { type, locked }
        });
    }
};
