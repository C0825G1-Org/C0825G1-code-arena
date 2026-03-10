import { useState, useEffect, useRef } from 'react';

interface UseWaitingRoomTimerProps {
    contest: any;
    onTimeUp?: () => void;
}

export const useWaitingRoomTimer = ({ contest, onTimeUp }: UseWaitingRoomTimerProps) => {
    const [serverOffset, setServerOffset] = useState<number>(0);
    const [waitingTimeLeftStr, setWaitingTimeLeftStr] = useState<string>('');
    const [isWaitingEnded, setIsWaitingEnded] = useState(false);
    // Guard để onTimeUp chi được gọi đúng 1 lần dù effect re-run nhiều lần (do contest object thay đổi reference)
    const onTimeUpFiredRef = useRef(false);

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
                setIsWaitingEnded(true);
                // Chỉ gọi onTimeUp đúng 1 lần dù interval chạy lại hoặc effect re-mount
                if (onTimeUp && !onTimeUpFiredRef.current) {
                    onTimeUpFiredRef.current = true;
                    onTimeUp();
                }
            } else {
                const m = Math.floor(diff / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                setWaitingTimeLeftStr(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [contest, serverOffset, onTimeUp]);

    return { serverOffset, waitingTimeLeftStr, isWaitingEnded };
};
