import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../app/store';
import { contestService } from '../../home/services/contestService';
import { leaderboardApiService, LeaderboardDTO } from '../services/leaderboardApiService';
import { toast } from 'react-hot-toast';
import { Avatar } from '../../../../shared/components/Avatar';
import {
    ArrowLeft, Trophy, CircleNotch, Medal, CheckCircle, Clock, ChartLineUp, Code
} from '@phosphor-icons/react';
import { ContestDetailData } from './UserContestDetailPage';
import { computeAndSort } from '../components/LeaderboardTab';
import { UserLayout } from '../../../../layouts/UserLayout';
import { GroupChat } from '../../../chat/components/GroupChat';

export const UserContestResultsPage = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useSelector((state: RootState) => state.auth);
    const navigate = useNavigate();

    const userRole = user?.role?.replace('ROLE_', '').toUpperCase() || '';
    const isModerator = userRole === 'MODERATOR' || userRole === 'ADMIN';

    const [contest, setContest] = useState<ContestDetailData | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardDTO[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            try {
                // Fetch contest info
                const contestData = await contestService.getContestDetail(Number(id));
                setContest(contestData);

                // Fetch leaderboard explicitly
                const lbData = await leaderboardApiService.getLeaderboard(Number(id));
                setLeaderboard(lbData);
            } catch (err) {
                console.error("Failed to fetch result data", err);
                toast.error("Không thể tải kết quả cuộc thi.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-slate-400">
                <div className="flex flex-col items-center gap-4">
                    <CircleNotch weight="bold" className="text-5xl animate-spin text-blue-500" />
                    <p className="font-medium">Đang tải kết quả...</p>
                </div>
            </div>
        );
    }

    if (!contest) return null;

    // Find current user's rank
    const sortedLeaderboard = computeAndSort(leaderboard);
    const myResult = sortedLeaderboard.find(lb => lb.userId === user?.id);

    return (
        <UserLayout>
            <main className="flex-1 container mx-auto px-4 sm:px-6 py-8 z-10 max-w-6xl">
                {/* Back Link */}
                <Link to={`/contests/${contest.id}`} className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 font-medium">
                    <ArrowLeft weight="bold" /> Trở về Chi tiết cuộc thi
                </Link>

                <div className="bg-slate-800/40 backdrop-blur-md rounded-3xl p-8 lg:p-12 border border-slate-700/50 shadow-2xl">
                    <div className="text-center mb-10">
                        <Trophy weight="duotone" className="text-6xl text-yellow-500 mx-auto mb-4" />
                        <h1 className="text-3xl font-extrabold text-white mb-2">Kết Quả Cuộc Thi</h1>
                        <p className="text-xl text-blue-400 font-medium">{contest.title}</p>
                    </div>

                    {/* Personal Summary Cards */}
                    {myResult ? (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                            {/* Rank Card */}
                            <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6 text-center transform hover:scale-105 transition-transform duration-300 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <Medal weight="fill" className={`text-4xl mx-auto mb-3 ${myResult.rank === 1 ? 'text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]' : myResult.rank === 2 ? 'text-slate-300 drop-shadow-[0_0_15px_rgba(203,213,225,0.5)]' : myResult.rank === 3 ? 'text-amber-600 drop-shadow-[0_0_15px_rgba(217,119,6,0.5)]' : 'text-blue-500'}`} />
                                <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-1">Thứ hạng</h3>
                                <div className="text-4xl font-black text-white">#{myResult.computedRank} <span className="text-lg text-slate-500 font-medium">/ {contest.participantCount}</span></div>
                            </div>

                            {/* Total Points Card */}
                            <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6 text-center transform hover:scale-105 transition-transform duration-300">
                                <Trophy weight="fill" className="text-4xl text-yellow-500 mx-auto mb-3" />
                                <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-1">Tổng Điểm</h3>
                                <div className="text-4xl font-black text-emerald-400">{myResult.computedPoints}<span className="text-xl text-slate-400 font-medium ml-1">đ</span></div>
                            </div>

                            {/* Solved Card */}
                            <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6 text-center transform hover:scale-105 transition-transform duration-300">
                                <CheckCircle weight="fill" className="text-4xl text-emerald-500 mx-auto mb-3" />
                                <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-1">Số bài giải</h3>
                                <div className="text-4xl font-black text-white">{myResult.computedSolved} <span className="text-lg text-slate-500 font-medium">bài</span></div>
                            </div>

                            {/* Penalty Card */}
                            <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6 text-center transform hover:scale-105 transition-transform duration-300">
                                <Clock weight="fill" className="text-4xl text-red-400 mx-auto mb-3" />
                                <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-1">Tổng Penalty</h3>
                                <div className="text-4xl font-black text-white">{myResult.computedPenalty} <span className="text-lg text-slate-500 font-medium">phút</span></div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-8 text-center mb-12">
                            <ChartLineUp weight="duotone" className="text-5xl text-slate-500 mx-auto mb-4" />
                            <p className="text-slate-300 text-lg">Bạn không tham gia hoặc chưa ghi nhận kết quả trong cuộc thi này.</p>
                        </div>
                    )}

                    {/* Two-Column Layout for Details */}
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Left Column: Problems & Detailed Results */}
                        <div className="flex-1 space-y-8">
                            {contest.problems && contest.problems.length > 0 ? (
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-200 mb-6 flex items-center gap-3">
                                        <Code weight="bold" className="text-blue-400" /> Danh sách bài tập
                                    </h2>
                                    <div className="space-y-4">
                                        {contest.problems.sort((a, b) => a.orderIndex - b.orderIndex).map((p, idx) => {
                                            const pResult = myResult?.problemDetails?.find(pd => pd.problemId === p.id);
                                            const statusClass = pResult
                                                ? (pResult.isAccepted
                                                    ? 'border-emerald-500/50 bg-emerald-500/10'
                                                    : (pResult.score > 0 ? 'border-orange-500/50 bg-orange-500/10' : 'border-red-500/50 bg-red-500/10'))
                                                : 'border-slate-700/50 bg-slate-900/50';

                                            return (
                                                <div key={p.id} className={`border rounded-2xl p-5 flex items-center justify-between transition-colors ${statusClass}`}>
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-2xl shadow-inner ${pResult?.isAccepted ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : pResult && pResult.score > 0 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : pResult && pResult.failedAttempts > 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-800/80 text-slate-300 border border-slate-700'}`}>
                                                            {String.fromCharCode(65 + idx)}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-xl text-slate-100">{p.title}</h3>
                                                            <div className="text-sm mt-1 flex items-center gap-3">
                                                                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${p.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-400' : p.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-400'}`}>
                                                                    {p.difficulty || 'Bình thường'}
                                                                </span>
                                                                <span className="text-slate-400 font-medium">{pResult ? pResult.score : 0} <span className="text-slate-500">/ {pResult?.maxScore ?? 0} Điểm</span></span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1 text-sm font-medium">
                                                        {pResult ? (
                                                            <>
                                                                <div className={`flex items-center gap-1.5 ${pResult.isAccepted ? 'text-emerald-400' : (pResult.score > 0 ? 'text-orange-400' : 'text-red-400')}`}>
                                                                    {pResult.isAccepted ? <CheckCircle weight="fill" className="text-lg" /> : (pResult.score > 0 ? <ChartLineUp weight="fill" className="text-lg" /> : <Clock weight="fill" className="text-lg" />)}
                                                                    {pResult.isAccepted ? 'Accepted' : (pResult.score > 0 ? 'Partial' : 'Failed')}
                                                                </div>
                                                                {pResult.failedAttempts > 0 && <div className="text-slate-400">{pResult.failedAttempts} lần thử sai</div>}
                                                                {pResult.isAccepted && pResult.solvedTimeMinutes > 0 && <div className="text-slate-400">Time: {pResult.solvedTimeMinutes}m</div>}
                                                            </>
                                                        ) : (
                                                            <span className="text-slate-500 flex items-center gap-1.5"><ChartLineUp className="text-lg" /> Chưa thử sức</span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-slate-900/40 border border-slate-700/50 rounded-2xl p-8 text-center">
                                    <p className="text-slate-400">Cuộc thi này không có bài tập nào.</p>
                                </div>
                            )}
                        </div>

                        {/* Right Column: Small Leaderboard Sidebar */}
                        <div className="w-full lg:w-[400px] shrink-0 space-y-8">
                            <div>
                                <h2 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
                                    <Trophy weight="fill" className="text-yellow-500" /> Top thí sinh xuất sắc
                                </h2>

                                <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 overflow-hidden shadow-xl">
                                    <div className="divide-y divide-slate-700/50">
                                        {sortedLeaderboard.slice(0, 5).map((u) => (
                                            <div key={u.userId} className={`flex items-center gap-4 p-4 transition-colors ${u.userId === user?.id ? 'bg-blue-900/30' : 'hover:bg-slate-800/40'}`}>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${u.computedRank === 1 ? 'bg-yellow-500/20 text-yellow-500' : u.computedRank === 2 ? 'bg-slate-300/20 text-slate-300' : u.computedRank === 3 ? 'bg-amber-600/20 text-amber-500' : 'bg-slate-800 text-slate-400'}`}>
                                                    {u.computedRank}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold text-slate-200 truncate">{u.fullName}</div>
                                                    <div className="text-xs text-slate-500 flex gap-2">
                                                        <span className="text-yellow-500 font-bold">{u.computedPoints} điểm</span>
                                                        <span>•</span>
                                                        <span className="text-emerald-400">{u.computedSolved} bài</span>
                                                        <span>•</span>
                                                        <span>{u.computedPenalty}m</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {leaderboard.length > 5 && (
                                        <div className="p-3 text-center bg-slate-800/50 border-t border-slate-700/50">
                                            <Link to={`/contests/${contest.id}`} className="text-blue-400 hover:text-blue-300 text-sm font-bold flex justify-center items-center gap-2">
                                                Xem toàn bộ <ArrowLeft className="rotate-180" />
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Group Chat for Post-Contest */}
                {user && (contest.status === 'upcoming' || contest.status === 'finished' || isModerator) && (
                    <GroupChat
                        contestId={Number(id)}
                        currentUser={{
                            id: user.id,
                            username: user.username,
                            fullName: user.fullName || '',
                            role: user.role,
                            isContestChatLocked: user.isContestChatLocked
                        }}
                        contestTitle={contest?.title}
                        contestStatus={contest.status}
                        endTime={contest.endTime}
                    />
                )}
            </main>
        </UserLayout>
    );
};
