import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSelector } from 'react-redux';

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
    const token = useSelector((state: any) => state.auth.token);

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

        if (!token) {
            console.log('Socket.IO (Contest updates) No token found. Connection aborted/disconnected.');
            return;
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

        // Listen for direct user lock
        socket.on('user_locked', () => {
            console.log('Socket.IO (Auth) Account locked by admin');
            window.dispatchEvent(new Event('auth:locked'));
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
            socket.off('user_locked');
            socket.off('user_lock_update');
            socket.disconnect();
            console.log('Socket.IO (Contest updates) Disconnected');
        };
    }, [token]);
};
