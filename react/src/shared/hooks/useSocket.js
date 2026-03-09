import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export const useSocket = (onMessage) => {
    const [socketInstance, setSocketInstance] = useState(null);

    useEffect(() => {
        const tokenStr = localStorage.getItem('token');
        let token = '';

        if (tokenStr) {
            try {
                const parsedToken = JSON.parse(tokenStr);
                token = typeof parsedToken === 'string' ? parsedToken : (parsedToken?.token || parsedToken?.accessToken || '');
            } catch (e) {
                token = tokenStr;
            }
        }

        if (!token) {
            console.warn('Socket.IO: No token found. Connection might be rejected.');
        }

        const socket = io('/', {
            query: { token },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        setSocketInstance(socket);

        socket.on('connect', () => {
            console.log('Socket.IO Connected to server');
        });

        socket.on('connect_error', (err) => {
            console.error('Socket.IO Connection Error:', err.message);
        });

        socket.on('submission_update', (data) => {
            console.log('Socket.IO Received submission_update:', data);
            if (onMessage) {
                onMessage({ event: 'submission_update', data });
            }
        });

        socket.on('user_lock_update', (data) => {
            console.log('Socket.IO Received user_lock_update:', data);
            if (onMessage) {
                onMessage({ event: 'user_lock_update', data });
            }
        });

        return () => {
            console.log('Socket.IO Disconnecting...');
            socket.off('submission_update');
            socket.off('user_lock_update');
            socket.disconnect();
        };
    }, []);

    return socketInstance;
};
