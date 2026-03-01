import React, { useEffect, useState } from 'react';
import { LeaderboardDTO, leaderboardApiService } from '../services/leaderboardApiService';
import { useLeaderboardSocket } from '../hooks/useLeaderboardSocket';
import { Trophy, Medal, CircleNotch } from '@phosphor-icons/react';
import { toast } from 'react-hot-toast';

interface LeaderboardTabProps {
    contestId: number;
}

export const LeaderboardTab: React.FC<LeaderboardTabProps> = ({ contestId }) => {
    const [leaderboard, setLeaderboard] = useState<LeaderboardDTO[]>([]);
    const [loading, setLoading] = useState(true);

    // Initial fetch
    useEffect(() => {
        const fetchBoard = async () => {
            setLoading(true);
            try {
                const data = await leaderboardApiService.getLeaderboard(contestId);
                setLeaderboard(data);
            } catch (err) {
                toast.error('Không thể tải bảng xếp hạng');
            } finally {
                setLoading(false);
            }
        };
        fetchBoard();
    }, [contestId]);

    // Real-time updates
    useLeaderboardSocket(contestId, (newData) => {
        setLeaderboard(newData);
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center p-12 text-blue-400">
                <CircleNotch weight="bold" className="text-4xl animate-spin" />
            </div>
        );
    }

    if (leaderboard.length === 0) {
        return (
            <div className="text-center p-12 bg-slate-800/20 rounded-2xl border border-slate-700/50">
                <Trophy weight="duotone" className="text-6xl text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">Chưa có ai ghi điểm trong cuộc thi này.</p>
                <p className="text-slate-500 text-sm mt-2">Hãy là người đầu tiên giải quyết bài tập!</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-900/60 rounded-3xl border border-slate-700/50 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-800/80 text-slate-300 text-sm uppercase tracking-wider">
                        <tr>
                            <th className="py-4 px-6 font-semibold w-24 text-center">Hạng</th>
                            <th className="py-4 px-6 font-semibold">Thí sinh</th>
                            <th className="py-4 px-6 font-semibold text-center w-32">Số bài giải</th>
                            <th className="py-4 px-6 font-semibold text-center w-32">Penalty (phút)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {leaderboard.map((user, idx) => {
                            // Style top 3
                            let rankDisplay = <span className="font-bold text-slate-400">{user.rank}</span>;
                            let bgClass = "hover:bg-slate-800/40 transition-colors";

                            if (user.rank === 1) {
                                rankDisplay = <Medal weight="fill" className="text-3xl text-yellow-400 mx-auto drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />;
                                bgClass = "bg-yellow-500/5 hover:bg-yellow-500/10 transition-colors";
                            } else if (user.rank === 2) {
                                rankDisplay = <Medal weight="fill" className="text-3xl text-slate-300 mx-auto drop-shadow-[0_0_8px_rgba(203,213,225,0.5)]" />;
                                bgClass = "bg-slate-300/5 hover:bg-slate-300/10 transition-colors";
                            } else if (user.rank === 3) {
                                rankDisplay = <Medal weight="fill" className="text-3xl text-amber-600 mx-auto drop-shadow-[0_0_8px_rgba(217,119,6,0.5)]" />;
                                bgClass = "bg-amber-700/5 hover:bg-amber-700/10 transition-colors";
                            }

                            return (
                                <tr key={user.userId} className={bgClass}>
                                    <td className="py-4 px-6 text-center align-middle">
                                        {rankDisplay}
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={`https://ui-avatars.com/api/?name=${user.username}&background=random`}
                                                alt="Avatar"
                                                className="w-10 h-10 rounded-full border border-slate-600"
                                            />
                                            <div>
                                                <div className="font-bold text-slate-200 text-lg">{user.username}</div>
                                                <div className="text-xs text-slate-400">{user.fullName || 'Thí sinh'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 font-bold rounded-lg border border-blue-500/30">
                                            {user.totalScore}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <span className="font-mono text-slate-300 font-semibold">
                                            {user.totalPenalty}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div className="bg-slate-800/50 p-4 border-t border-slate-700/50 text-xs text-slate-400 text-center">
                * Bảng xếp hạng áp dụng quy tắc ICPC: Sắp xếp theo số bài AC giảm dần, sau đó theo tổng Penalty (Thời gian + 20 phút/lần nộp sai) tăng dần.
            </div>
        </div>
    );
};
