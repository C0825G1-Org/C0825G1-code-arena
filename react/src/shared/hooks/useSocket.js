import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';

export const useSocket = (onMessage) => {
    const [socketInstance, setSocketInstance] = useState(null);
    const token = useSelector(state => state.auth.token);
    const onMessageRef = useRef(onMessage);

    // Cập nhật ref mỗi khi onMessage thay đổi mà không cần trigger useEffect kết nối
    useEffect(() => {
        onMessageRef.current = onMessage;
    }, [onMessage]);

    useEffect(() => {
        if (!token) {
            console.warn('Socket.IO: No token found. Disconnecting/Aborting connection.');
            setSocketInstance(null);
            return;
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
            if (onMessageRef.current) {
                onMessageRef.current({ event: 'submission_update', data });
            }
        });

        socket.on('user_lock_update', (data) => {
            console.log('Socket.IO Received user_lock_update:', data);
            if (onMessageRef.current) {
                onMessageRef.current({ event: 'user_lock_update', data });
            }
        });

        return () => {
            console.log('Socket.IO Disconnecting...');
            socket.off('submission_update');
            socket.off('user_lock_update');
            socket.disconnect();
            setSocketInstance(null);
        };
    }, [token]); // Chỉ phụ thuộc vào token

    return socketInstance;
};
