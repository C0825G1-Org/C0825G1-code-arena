import React from 'react';
import { UserStats } from '../services/profileService';

interface Props {
    stats?: UserStats;
}

const ProfileStatsPanel: React.FC<Props> = ({ stats }) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass p-4 rounded-xl border border-slate-700/50 flex flex-col">
                <span className="text-slate-400 text-sm mb-1">Đã giải</span>
                <span className="text-2xl font-bold text-white">
                    {stats?.solvedCount || 0}
                </span>
            </div>
            <div className="glass p-4 rounded-xl border border-slate-700/50 flex flex-col">
                <span className="text-slate-400 text-sm mb-1">Chuỗi ngày coding</span>
                <span className="text-2xl font-bold text-white">{stats?.streak || 0}</span>
            </div>
            <div className="glass p-4 rounded-xl border border-slate-700/50 flex flex-col">
                <span className="text-slate-400 text-sm mb-1">Tỉ lệ AC</span>
                <span className="text-2xl font-bold text-green-400">{stats?.acRate || 0}%</span>
            </div>
            <div className="glass p-4 rounded-xl border border-slate-700/50 flex flex-col">
                <span className="text-slate-400 text-sm mb-1">Top</span>
                <span className="text-2xl font-bold text-yellow-500">{stats?.topPercent || 0}%</span>
            </div>
        </div>
    );
};

export default ProfileStatsPanel;
