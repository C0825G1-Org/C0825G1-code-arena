import React, { useState, useEffect } from 'react';
import { Clock } from '@phosphor-icons/react';

interface ContestTimerProps {
    endTime: string; // ISO string
    onTimeUp?: () => void;
}

const ContestTimer: React.FC<ContestTimerProps> = ({ endTime, onTimeUp }) => {
    const [timeLeft, setTimeLeft] = useState<number>(0);

    useEffect(() => {
        const target = new Date(endTime).getTime();

        const updateTimer = () => {
            const now = new Date().getTime();
            const diff = Math.max(0, Math.floor((target - now) / 1000));
            setTimeLeft(diff);

            if (diff === 0 && onTimeUp) {
                onTimeUp();
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [endTime, onTimeUp]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (timeLeft <= 0) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-900/30 text-red-400 border border-red-800 rounded font-mono text-sm font-bold animate-pulse">
                <Clock size={18} weight="fill" />
                <span>HẾT GIỜ</span>
            </div>
        );
    }

    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded font-mono text-sm font-bold border transition-colors ${timeLeft < 300
                ? 'bg-red-900/20 text-red-500 border-red-800 animate-pulse'
                : 'bg-slate-800 text-green-400 border-slate-700'
            }`}>
            <Clock size={18} weight="fill" />
            <span>{formatTime(timeLeft)}</span>
            {timeLeft < 300 && <span className="text-[10px] ml-1 uppercase">Sắp hết giờ!</span>}
        </div>
    );
};

export default ContestTimer;
