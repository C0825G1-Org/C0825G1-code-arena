import React from 'react';
import { RecentContest } from '../services/profileService';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';

interface Props {
    contests: RecentContest[];
}

const RecentContestsTable: React.FC<Props> = ({ contests }) => {
    return (
        <div className="glass rounded-2xl overflow-hidden shadow-xl border border-purple-700/50 mt-6">
            <div className="p-6 pb-4 border-b border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-lg text-white">Lịch sử cuộc thi</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-400 font-mono">
                    <thead className="text-xs uppercase bg-slate-800/50 text-slate-300 border-b border-slate-700">
                        <tr>
                            <th className="px-6 py-3">Cuộc thi</th>
                            <th className="px-6 py-3 text-center">Tình trạng thi</th>
                            <th className="px-6 py-3">Điểm số</th>
                            <th className="px-6 py-3 text-center">Bắt đầu</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contests?.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-4 text-center text-slate-500">Chưa tham gia cuộc thi nào</td>
                            </tr>
                        ) : (
                            contests?.map((c) => {
                                let statusClass = 'bg-slate-600';
                                if (c.status === 'FINISHED' || c.status === 'JOINED') statusClass = 'bg-green-600';
                                else if (c.status === 'QUIT' || c.status === 'DISQUALIFIED') statusClass = 'bg-red-600';

                                return (
                                    <tr key={c.contestId} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-3 font-medium text-purple-400 hover:underline cursor-pointer">
                                            <Link to={`/contests/${c.contestId}`} className="block w-full h-full">
                                                {c.title}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <span className={`px-2 py-0.5 rounded text-white font-bold text-xs ${statusClass}`}>
                                                {c.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 font-bold text-yellow-500">{c.totalScore}
                                            <span className="text-slate-500 text-xs font-normal"> pt</span>
                                        </td>
                                        <td className="px-6 py-3 text-center">{dayjs(c.startTime).format('DD/MM/YY HH:mm')}</td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RecentContestsTable;
