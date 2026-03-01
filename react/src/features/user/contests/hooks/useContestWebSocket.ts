import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export const useContestWebSocket = (onContestUpdate: (contestId: number, status: string) => void) => {
    const callbackRef = useRef(onContestUpdate);

    // Update ref when callback changes
    useEffect(() => {
        callbackRef.current = onContestUpdate;
    }, [onContestUpdate]);

    useEffect(() => {
        // Init Socket.IO Client
        // Note: The port 9092 is handled by Dev Nguyen's SocketIOServer
        const socket: Socket = io('http://localhost:9092', {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
        });

        socket.on('connect', () => {
            console.log('Socket.IO (Contest updates) Connected to server!');
        });

        socket.on('connect_error', (err) => {
            console.error('Socket.IO Connection Error:', err.message);
        });

        // Listen for the custom event broadcasted by ContestEventScheduler
        socket.on('contest_update', (data: any) => {
            console.log('Received Socket.IO contest_update:', data);
            if (data.contestId && data.status) {
                // Always call the latest callback via ref
                callbackRef.current(data.contestId, data.status);
            }
        });

        return () => {
            if (socket.connected) {
                socket.off('contest_update');
                socket.disconnect();
                console.log('Socket.IO (Contest updates) Disconnected');
            }
        };
    }, []); // Establish connection only once per component mount
};
