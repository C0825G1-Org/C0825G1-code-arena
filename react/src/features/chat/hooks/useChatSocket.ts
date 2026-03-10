import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { ChatMessage } from '../services/chatService';

export const useChatSocket = (contestId: number, onNewMessage: (msg: ChatMessage) => void) => {
    const socketRef = useRef<Socket | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        let token = '';
        const tokenStr = localStorage.getItem('token');
        if (tokenStr) {
            try {
                const parsedToken = JSON.parse(tokenStr);
                token = typeof parsedToken === 'string' ? parsedToken : (parsedToken?.token || parsedToken?.accessToken || '');
            } catch (e) {
                token = tokenStr;
            }
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
        });

        return () => {
            socket.emit('leave_contest_chat', contestId);
            socket.disconnect();
            socketRef.current = null;
        };
    }, [contestId]);

    const sendMessage = (content: string) => {
        if (socketRef.current && connected) {
            socketRef.current.emit('send_chat_message', { contestId, content });
        }
    };

    return { connected, sendMessage };
};
