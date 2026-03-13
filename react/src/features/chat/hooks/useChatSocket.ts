import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { ChatMessage } from '../services/chatService';

export const useChatSocket = (
    contestId: number,
    onNewMessage: (msg: ChatMessage) => void,
    onChatError?: (error: string) => void
) => {
    const socketRef = useRef<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    const errorCallbackRef = useRef(onChatError);
    const token = useSelector((state: any) => state.auth.token);

    useEffect(() => {
        errorCallbackRef.current = onChatError;
    }, [onChatError]);

    useEffect(() => {
        if (!token) {
            console.log('Socket.IO (Chat) No token found. Connection aborted/disconnected.');
            return;
        }

        // Connect to Socket.IO server (same pattern as useSocket.js)
        const socket: Socket = io('/', {
            query: { token },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketRef.current = socket;

        // Xử lý trường hợp Manager đã gộp socket & connect sẵn
        if (socket.connected) {
            setConnected(true);
            socket.emit('join_contest_chat', contestId);
        }

        socket.on('connect', () => {
            console.log('Chat Socket Connected');
            setConnected(true);
            socket.emit('join_contest_chat', contestId);
        });

        socket.on('disconnect', () => {
            console.log('Chat Socket Disconnected');
            setConnected(false);
        });

        socket.on('new_chat_message', (message: ChatMessage) => {
            onNewMessage(message);
        });

        socket.on('chat_error', (error: string) => {
            console.error('Chat Error:', error);
            if (errorCallbackRef.current) {
                errorCallbackRef.current(error);
            }
        });

        return () => {
            socket.emit('leave_contest_chat', contestId);
            socket.disconnect();
            socketRef.current = null;
        };
    }, [contestId, token]);

    const sendMessage = (content: string) => {
        if (socketRef.current && connected) {
            socketRef.current.emit('send_chat_message', { contestId, content });
        }
    };

    return { connected, sendMessage };
};
