import { useState, useEffect } from 'react';

interface UseWaitingRoomTimerProps {
    contest: any;
    onTimeUp?: () => void;
}

export const useWaitingRoomTimer = ({ contest, onTimeUp }: UseWaitingRoomTimerProps) => {
    const [serverOffset, setServerOffset] = useState<number>(0);
    const [waitingTimeLeftStr, setWaitingTimeLeftStr] = useState<string>('');
    const [isTimeUp, setIsTimeUp] = useState(false);

    // Tính toán độ hụt thời gian giữa Client và Server
    useEffect(() => {
        if (contest && contest.status === 'upcoming' && contest.serverTime && contest.startTime) {
            const local = new Date().getTime();
            const server = new Date(contest.serverTime).getTime();
            setServerOffset(server - local);
        }
    }, [contest]);

    // Timer đếm ngược
    useEffect(() => {
        if (!contest || contest.status !== 'upcoming') return;
        const targetMs = new Date(contest.startTime).getTime();

        const timer = setInterval(() => {
            const nowReal = new Date().getTime() + serverOffset;
            const diff = targetMs - nowReal;
            if (diff <= 0) {
                clearInterval(timer);
                setWaitingTimeLeftStr('Bắt đầu!');
                setIsTimeUp(true); // Báo hiệu đã hết giờ chờ
                if (onTimeUp) onTimeUp();
            } else {
                const m = Math.floor(diff / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                setWaitingTimeLeftStr(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [contest, serverOffset]);

    return { serverOffset, waitingTimeLeftStr, isTimeUp, setIsTimeUp };
};
