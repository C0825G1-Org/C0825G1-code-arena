import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export const useSocket = (onMessage) => {
    const socketRef = useRef(null);

    useEffect(() => {
        const tokenStr = localStorage.getItem('token');
        let token = '';

        // If the token is stored as a JSON object, parse it. Otherwise, use it directly.
        if (tokenStr) {
            try {
                const parsedToken = JSON.parse(tokenStr);
                // Assume the token string is inside a 'token' property if it's an object, or we just take the parsedToken.
                token = typeof parsedToken === 'string' ? parsedToken : (parsedToken?.token || parsedToken?.accessToken || '');
            } catch (e) {
                // It's a raw string
                token = tokenStr;
            }
        }

        if (!token) {
            console.warn('Socket.IO: No token found. Connection might be rejected.');
        }

        const socket = io('http://localhost:9092', {
            query: { token },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Socket.IO Connected to server');
        });

        socket.on('connect_error', (err) => {
            console.error('Socket.IO Connection Error:', err.message);
        });

        socket.on('submission_update', (data) => {
            console.log('Socket.IO Received submission_update:', data);
            if (onMessage) {
                onMessage(data);
            }
        });

        return () => {
            console.log('Socket.IO Disconnecting...');
            socket.off('submission_update');
            socket.disconnect();
        };
    }, []); // Empty dependency array means it runs on mount and unmount

    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/rules-of-hooks, react-hooks/refs
    return socketRef.current;
};
