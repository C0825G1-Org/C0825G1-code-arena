import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface ContestReminderData {
    contestId: number;
    contestTitle: string;
    minutesLeft: number;
}

export const useContestWebSocket = (
    onContestUpdate: (contestId: number, status: string) => void,
    onContestReminder?: (data: ContestReminderData) => void
) => {
    const callbackRef = useRef(onContestUpdate);
    const reminderCallbackRef = useRef(onContestReminder);
    // Update ref when callback changes
    useEffect(() => {
        callbackRef.current = onContestUpdate;
    }, [onContestUpdate]);

    // Sync reminder callback ref
    useEffect(() => {
        reminderCallbackRef.current = onContestReminder;
    }, [onContestReminder]);

    useEffect(() => {
        let isActive = true;
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

        // Init Socket.IO Client
        // Note: The port 9092 is handled by Dev Nguyen's SocketIOServer
        const socket: Socket = io('http://localhost:9092', {
            query: { token },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
        });

        socket.on('contest_reminder', (data: any) => {
            if (!isActive) return;
            if (data.contestId && data.minutesLeft) {
                reminderCallbackRef.current?.(data);
            }
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
            if (!isActive) return;
            if (data.contestId && data.status) {
                // Always call the latest callback via ref
                callbackRef.current(data.contestId, data.status);
            }
        });

        return () => {
            isActive = false; // Luôn reset flag dù socket có connected hay không
            socket.off('contest_update');
            socket.off('contest_reminder');
            socket.disconnect();
            console.log('Socket.IO (Contest updates) Disconnected');
        };
    }, []); // Establish connection only once per component mount
};
