import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { LeaderboardDTO } from '../services/leaderboardApiService';

export const useLeaderboardSocket = (contestId: number, onUpdate: (data: LeaderboardDTO[]) => void) => {
    const callbackRef = useRef(onUpdate);

    useEffect(() => {
        callbackRef.current = onUpdate;
    }, [onUpdate]);

    useEffect(() => {
        if (!contestId) return;

        const socket: Socket = io('http://localhost:9092', {
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
    }, [contestId]);
};
