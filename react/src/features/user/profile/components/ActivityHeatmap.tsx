import React from 'react';
import { HeatmapData } from '../services/profileService';
import dayjs from 'dayjs';

interface Props {
    heatmapData: HeatmapData[];
}

const ActivityHeatmap: React.FC<Props> = ({ heatmapData }) => {
    // Generate an array of last 35 days (5 weeks x 7 days)
    const today = dayjs();
    const days = Array.from({ length: 35 }).map((_, i) => {
        const date = today.subtract(34 - i, 'day').format('YYYY-MM-DD');
        const countStat = heatmapData?.find(d => d.date === date);
        const count = countStat ? countStat.count : 0;

        let heatClass = 'heat-0 bg-slate-800'; // fallback
        if (count === 0) heatClass = 'heat-0 bg-slate-800';
        else if (count <= 2) heatClass = 'heat-1 bg-teal-900';
        else if (count <= 5) heatClass = 'heat-2 bg-teal-700';
        else if (count <= 10) heatClass = 'heat-3 bg-emerald-500';
        else heatClass = 'heat-4 bg-emerald-400';

        return { date, count, heatClass };
    });

    return (
        <div className="glass p-6 rounded-2xl w-full overflow-hidden">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <i className="ph-fill ph-fire text-orange-500"></i> Hoạt động 35 ngày qua
            </h3>

            <div className="flex flex-wrap gap-1 max-w-full">
                {days.map((day, idx) => (
                    <div
                        key={idx}
                        className={`w-[14px] h-[14px] rounded-[2px] ${day.heatClass}`}
                        title={`${day.count} bài nộp vào ${day.date}`}
                    ></div>
                ))}
            </div>

            <div className="flex items-center justify-end gap-2 mt-4 text-xs text-slate-400">
                <span>Ít</span>
                <div className="w-[14px] h-[14px] rounded-[2px] bg-slate-800 border border-slate-700"></div>
                <div className="w-[14px] h-[14px] rounded-[2px] bg-teal-900 border border-slate-700"></div>
                <div className="w-[14px] h-[14px] rounded-[2px] bg-teal-700 border border-slate-700"></div>
                <div className="w-[14px] h-[14px] rounded-[2px] bg-emerald-500 border border-slate-700"></div>
                <div className="w-[14px] h-[14px] rounded-[2px] bg-emerald-400 border border-slate-700"></div>
                <span>Nhiều</span>
            </div>
        </div>
    );
};

export default ActivityHeatmap;
