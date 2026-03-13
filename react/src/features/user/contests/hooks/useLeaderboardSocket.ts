import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { LeaderboardDTO } from '../services/leaderboardApiService';

export const useLeaderboardSocket = (contestId: number, onUpdate: (data: LeaderboardDTO[]) => void) => {
    const callbackRef = useRef(onUpdate);
    const token = useSelector((state: any) => state.auth.token);

    useEffect(() => {
        callbackRef.current = onUpdate;
    }, [onUpdate]);

    useEffect(() => {
        if (!contestId) return;

        if (!token) {
            console.log('Socket.IO (Leaderboard) No token found. Connection aborted/disconnected.');
            return;
        }

        const socket: Socket = io('/', {
            query: { token },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
        });

        socket.on('connect', () => {
            console.log(`Socket.IO (Leaderboard) Connected for contest ${contestId}`);
        });

        socket.on('leaderboard_update', (data: { contestId: number, leaderboard: LeaderboardDTO[] }) => {
            if (data && data.contestId === contestId && data.leaderboard) {
                console.log('Received real-time leaderboard update:', data.leaderboard);
                callbackRef.current(data.leaderboard);
            }
        });

        return () => {
            if (socket.connected) {
                socket.off('leaderboard_update');
                socket.disconnect();
                console.log('Socket.IO (Leaderboard) Disconnected');
            }
        };
    }, [contestId, token]);
};

