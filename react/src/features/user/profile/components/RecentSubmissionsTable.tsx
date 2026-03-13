import React from 'react';
import { RecentSubmission } from '../services/profileService';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';

interface Props {
    submissions: RecentSubmission[];
}

const RecentSubmissionsTable: React.FC<Props> = ({ submissions }) => {
    return (
        <div className="glass rounded-2xl overflow-hidden shadow-xl border border-slate-700/50 mt-6">
            <div className="p-6 pb-4 border-b border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-lg text-white">Lịch sử nộp bài gần đây</h3>
                {/* <button className="text-sm text-blue-400 hover:underline">Xem tất cả</button> */}
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-400 font-mono">
                    <thead className="text-xs uppercase bg-slate-800/50 text-slate-300 border-b border-slate-700">
                        <tr>
                            <th className="px-6 py-3">Bài tập</th>
                            <th className="px-6 py-3 text-center">Trạng thái</th>
                            <th className="px-6 py-3">Ngôn ngữ</th>
                            <th className="px-6 py-3">Thời gian</th>
                            <th className="px-6 py-3">Bộ nhớ</th>
                            <th className="px-6 py-3">Ngày nộp</th>
                        </tr>
                    </thead>
                    <tbody>
                        {submissions?.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-slate-500">Chưa có bài nộp nào</td>
                            </tr>
                        ) : (
                            submissions?.map((sub) => {
                                let statusClass = 'bg-slate-600';
                                if (sub.status === 'AC') statusClass = 'bg-green-600';
                                else if (sub.status === 'WA' || sub.status === 'RE') statusClass = 'bg-red-600';
                                else if (sub.status === 'TLE' || sub.status === 'MLE') statusClass = 'bg-yellow-600';

                                return (
                                    <tr key={sub.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-3 font-medium text-blue-400 hover:underline cursor-pointer">
                                            <Link to={`/problems/${sub.problemSlug}`} className="block w-full h-full">
                                                {sub.problemId}. {sub.problemTitle}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <span className={`px-2 py-0.5 rounded text-white font-bold text-xs ${statusClass}`}>
                                                {sub.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">{sub.language}</td>
                                        <td className="px-6 py-3">{sub.executionTime} ms</td>
                                        <td className="px-6 py-3">{sub.memoryUsage.toFixed(1)} MB</td>
                                        <td className="px-6 py-3">{dayjs(sub.createdAt).format('DD/MM/YYYY HH:mm')}</td>
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

export default RecentSubmissionsTable;
