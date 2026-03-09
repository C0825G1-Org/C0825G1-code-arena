import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface ContestReminderData {
    contestId: number;
    contestTitle: string;
    minutesLeft: number;
}

export const useContestWebSocket = (
    onContestUpdate: (contestId: number, status: string) => void,
    onContestReminder?: (data: ContestReminderData) => void,
    onUserLockUpdate?: (data: { type: 'chat' | 'discussion', locked: boolean }) => void
) => {
    const callbackRef = useRef(onContestUpdate);
    const reminderCallbackRef = useRef(onContestReminder);
    const userLockCallbackRef = useRef(onUserLockUpdate);

    // Update ref when callback changes
    useEffect(() => {
        callbackRef.current = onContestUpdate;
    }, [onContestUpdate]);

    useEffect(() => {
        reminderCallbackRef.current = onContestReminder;
    }, [onContestReminder]);

    useEffect(() => {
        userLockCallbackRef.current = onUserLockUpdate;
    }, [onUserLockUpdate]);

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
        const socket: Socket = io('/', {
            query: { token },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
        });

        socket.on('connect', () => {
            console.log('Socket.IO (Contest updates) Connected to server!');
            // Join user room for private notifications
            try {
                if (token) {
                    // Extracting userId from token client-side is optional since server does it,
                    // but we can just emit an event to be sure if server needs it.
                    // Actually SocketIOConfig.java already joins the room on connect.
                }
            } catch (e) { }
        });

        socket.on('contest_reminder', (data: any) => {
            if (!isActive) return;
            if (data.contestId && data.minutesLeft) {
                reminderCallbackRef.current?.(data);
            }
        });

        socket.on('user_lock_update', (data: any) => {
            if (!isActive) return;
            console.log('Received Socket.IO user_lock_update:', data);
            userLockCallbackRef.current?.(data);
        });

        socket.on('connect_error', (err) => {
            console.error('Socket.IO Connection Error:', err.message);
        });

        // Listen for the custom event broadcasted by ContestEventScheduler
        socket.on('contest_update', (data: any) => {
            console.log('Received Socket.IO contest_update:', data);
            if (!isActive) return;
            if (data.contestId && data.status) {
                callbackRef.current(data.contestId, data.status);
            }
        });

        return () => {
            isActive = false;
            socket.off('contest_update');
            socket.off('contest_reminder');
            socket.off('user_lock_update');
            socket.disconnect();
            console.log('Socket.IO (Contest updates) Disconnected');
        };
    }, []);
};
