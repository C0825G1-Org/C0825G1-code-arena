import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../../app/store';
import { logout } from '../../../auth/store/authSlice';
import { contestService } from '../../home/services/contestService';
import { leaderboardApiService, LeaderboardDTO } from '../services/leaderboardApiService';
import { toast } from 'react-hot-toast';
import {
    Code, Bell, ShieldStar, ArrowLeft,
    Trophy, CircleNotch, Medal, CheckCircle, Clock, ChartLineUp
} from '@phosphor-icons/react';
import { ContestDetailData } from './UserContestDetailPage';

export const UserContestResultsPage = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();
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
    const myResult = leaderboard.find(lb => lb.userId === user?.id);

    return (
        <div className="antialiased min-h-screen flex flex-col relative bg-[#0f172a] text-slate-50 font-sans overflow-x-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none" />
            <div className="absolute top-[10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none" />

            {/* Navbar */}
            <nav className="sticky top-0 z-50 px-6 py-4 flex justify-between items-center border-b border-white/10 bg-slate-900/60 backdrop-blur-xl">
                <div className="flex items-center gap-8">
                    <Link to="/home" className="flex items-center gap-2 text-2xl font-bold tracking-tighter">
                        <Code weight="fill" className="text-blue-500 text-3xl" />
                        <span className="text-white">Code<span className="text-blue-500">Arena</span></span>
                    </Link>
                    <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
                        <Link to="/home" className="hover:text-blue-400 transition-colors">Trang chủ</Link>
                        <Link to="/problems" className="hover:text-blue-400 transition-colors">Bài tập</Link>
                        <Link to="/contests" className="text-blue-400 hover:text-blue-300 transition-colors border-b-2 border-blue-400 pb-1">Cuộc thi</Link>
                        <Link to="/leaderboard" className="hover:text-blue-400 transition-colors">Bảng xếp hạng</Link>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {isModerator && (
                        <Link to={userRole === 'ADMIN' ? '/admin/dashboard' : '/moderator/dashboard'} className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600/20 text-blue-300 hover:bg-blue-600/40 transition-all text-sm font-medium border border-blue-500/20">
                            <ShieldStar weight="duotone" className="text-lg" /> <span>Quản trị</span>
                        </Link>
                    )}
                    <Link to="/profile" className="flex items-center gap-3 cursor-pointer group pl-3 border-l border-slate-700 hover:bg-slate-800/50 p-2 rounded-xl transition-colors">
                        <img src={`https://i.pravatar.cc/150?u=${user?.id || 1}`} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-blue-500/50 object-cover" />
                    </Link>
                </div>
            </nav>

            <main className="flex-1 container mx-auto px-4 sm:px-6 py-12 z-10 max-w-5xl">
                <Link to={`/contests/${contest.id}`} className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 font-medium">
                    <ArrowLeft weight="bold" /> Trở về Chi tiết cuộc thi
                </Link>

                <div className="bg-slate-800/40 backdrop-blur-md rounded-3xl p-8 lg:p-12 border border-slate-700/50 shadow-2xl">
                    <div className="text-center mb-10">
                        <Trophy weight="duotone" className="text-6xl text-yellow-500 mx-auto mb-4" />
                        <h1 className="text-3xl font-extrabold text-white mb-2">Kết Quả Cuộc Thi</h1>
                        <p className="text-xl text-blue-400 font-medium">{contest.title}</p>
                    </div>

                    {myResult ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                            {/* Rank Card */}
                            <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6 text-center transform hover:scale-105 transition-transform duration-300">
                                <Medal weight="fill" className={`text-4xl mx-auto mb-3 ${myResult.rank === 1 ? 'text-yellow-400' : myResult.rank === 2 ? 'text-slate-300' : myResult.rank === 3 ? 'text-amber-600' : 'text-blue-500'}`} />
                                <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-1">Thứ hạng của bạn</h3>
                                <div className="text-4xl font-black text-white">#{myResult.rank} <span className="text-lg text-slate-500 font-medium">/ {contest.participantCount}</span></div>
                            </div>

                            {/* Score Card */}
                            <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6 text-center transform hover:scale-105 transition-transform duration-300">
                                <CheckCircle weight="fill" className="text-4xl text-emerald-500 mx-auto mb-3" />
                                <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-1">Số bài giải được</h3>
                                <div className="text-4xl font-black text-white">{myResult.totalScore} <span className="text-lg text-slate-500 font-medium">bài</span></div>
                            </div>

                            {/* Penalty Card */}
                            <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6 text-center transform hover:scale-105 transition-transform duration-300">
                                <Clock weight="fill" className="text-4xl text-red-400 mx-auto mb-3" />
                                <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-1">Tổng Penalty</h3>
                                <div className="text-4xl font-black text-white">{myResult.totalPenalty} <span className="text-lg text-slate-500 font-medium">phút</span></div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-8 text-center mb-12">
                            <ChartLineUp weight="duotone" className="text-5xl text-slate-500 mx-auto mb-4" />
                            <p className="text-slate-300 text-lg">Bạn không tham gia hoặc chưa ghi nhận kết quả trong cuộc thi này.</p>
                        </div>
                    )}

                    {/* Quick Leaderboard Preview */}
                    <div>
                        <h2 className="text-2xl font-bold text-slate-200 mb-6 flex items-center gap-3">
                            <Trophy weight="fill" className="text-yellow-500" /> Bảng xếp hạng Top 5
                        </h2>

                        <div className="overflow-x-auto rounded-2xl border border-slate-700/50 bg-slate-900/40">
                            <table className="w-full text-left">
                                <thead className="bg-slate-800 text-slate-300 text-sm">
                                    <tr>
                                        <th className="py-4 px-6 w-24 text-center">Hạng</th>
                                        <th className="py-4 px-6">Thí sinh</th>
                                        <th className="py-4 px-6 text-center">Số bài giải</th>
                                        <th className="py-4 px-6 text-center">Penalty</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {leaderboard.slice(0, 5).map((u) => (
                                        <tr key={u.userId} className={`${u.userId === user?.id ? 'bg-blue-900/30' : 'hover:bg-slate-800/40'} transition-colors`}>
                                            <td className="py-4 px-6 text-center font-bold text-slate-300">{u.rank}</td>
                                            <td className="py-4 px-6">
                                                <div className="font-bold text-slate-200">{u.username}</div>
                                                <div className="text-xs text-slate-400">{u.fullName}</div>
                                            </td>
                                            <td className="py-4 px-6 text-center font-bold text-emerald-400">{u.totalScore}</td>
                                            <td className="py-4 px-6 text-center font-mono text-slate-300">{u.totalPenalty}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {leaderboard.length > 5 && (
                                <div className="p-4 text-center bg-slate-800/30">
                                    <Link to={`/contests/${contest.id}`} className="text-blue-400 hover:text-blue-300 font-medium">
                                        Xem toàn bộ bảng xếp hạng &rarr;
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
