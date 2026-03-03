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
    Trophy, CircleNotch, Medal, CheckCircle, Clock, ChartLineUp, SignOut,
    FacebookLogo, TwitterLogo, GithubLogo
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

    const handleLogout = () => {
        navigate('/');
        setTimeout(() => {
            dispatch(logout());
        }, 10);
    };
    return (
        <div className="antialiased min-h-screen flex flex-col relative bg-[#0f172a] text-slate-50 font-sans overflow-clip">
            {/* Background Glows */}
            <div className="absolute top-[10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[20%] right-[-10%] w-[30%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

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
                        <Link to="/contests" className="text-white hover:text-blue-400 transition-colors">Cuộc thi</Link>
                        <Link to="/leaderboard" className="hover:text-blue-400 transition-colors">Bảng xếp hạng</Link>
                        <Link to="/discussions" className="hover:text-blue-400 transition-colors">Thảo luận</Link>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {isModerator && (
                        <Link
                            to={userRole === 'ADMIN' ? '/admin/dashboard' : '/moderator/dashboard'}
                            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-600/20 text-purple-300 hover:bg-purple-600/40 hover:text-purple-100 transition-all text-sm font-medium border border-purple-500/20"
                        >
                            <ShieldStar weight="duotone" className="text-lg" />
                            <span>Quản trị</span>
                        </Link>
                    )}

                    <button className="p-2 rounded-full hover:bg-slate-800 transition-colors text-slate-300">
                        <Bell className="text-xl" />
                    </button>

                    <Link to="/profile" className="flex items-center gap-3 cursor-pointer group pl-3 border-l border-slate-700 hover:bg-slate-800/50 p-2 rounded-xl transition-colors">
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">{user?.fullName || 'User'}</div>
                            <div className="text-xs text-slate-400 font-mono">Rating: <span className="text-yellow-400">0</span></div>
                        </div>
                        <img src={`https://i.pravatar.cc/150?u=${user?.id || 1}`} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-blue-500/50 object-cover" />
                    </Link>
                    <button onClick={handleLogout} title="Đăng xuất" className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors border border-red-500/20 bg-red-500/5 hover:border-red-500/50"><SignOut weight="bold" className="text-xl" /></button>
                </div>
            </nav>

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

                    {/* Personal Summary Cards (Unified Sizes) */}
                    {myResult ? (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                            {/* Rank Card */}
                            <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6 text-center transform hover:scale-105 transition-transform duration-300 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <Medal weight="fill" className={`text-4xl mx-auto mb-3 ${myResult.rank === 1 ? 'text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]' : myResult.rank === 2 ? 'text-slate-300 drop-shadow-[0_0_15px_rgba(203,213,225,0.5)]' : myResult.rank === 3 ? 'text-amber-600 drop-shadow-[0_0_15px_rgba(217,119,6,0.5)]' : 'text-blue-500'}`} />
                                <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-1">Thứ hạng</h3>
                                <div className="text-4xl font-black text-white">#{myResult.rank} <span className="text-lg text-slate-500 font-medium">/ {contest.participantCount}</span></div>
                            </div>

                            {/* Total Points Card */}
                            <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6 text-center transform hover:scale-105 transition-transform duration-300">
                                <Trophy weight="fill" className="text-4xl text-yellow-500 mx-auto mb-3" />
                                <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-1">Tổng Điểm</h3>
                                <div className="text-4xl font-black text-emerald-400">{myResult.totalScore}</div>
                            </div>

                            {/* Solved Card */}
                            <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6 text-center transform hover:scale-105 transition-transform duration-300">
                                <CheckCircle weight="fill" className="text-4xl text-emerald-500 mx-auto mb-3" />
                                <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-1">Số bài giải</h3>
                                <div className="text-4xl font-black text-white">{myResult.totalSolved} <span className="text-lg text-slate-500 font-medium">bài</span></div>
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

                    {/* Two-Column Layout for Details */}
                    <div className="flex flex-col lg:flex-row gap-8">

                        {/* Left Column: Problems & Detailed Results */}
                        <div className="flex-1 space-y-8">
                            {/* Detailed Problem Status List */}
                            {contest.problems && contest.problems.length > 0 ? (
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-200 mb-6 flex items-center gap-3">
                                        <Code weight="bold" className="text-blue-400" /> Danh sách bài tập
                                    </h2>
                                    <div className="space-y-4">
                                        {contest.problems.sort((a, b) => a.orderIndex - b.orderIndex).map((p, idx) => {
                                            const pResult = myResult?.problemDetails?.find(pd => pd.problemId === p.id);
                                            const statusClass = pResult
                                                ? (pResult.isAccepted ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-red-500/50 bg-red-500/10')
                                                : 'border-slate-700/50 bg-slate-900/50';

                                            return (
                                                <div key={p.id} className={`border rounded-2xl p-5 flex items-center justify-between transition-colors ${statusClass}`}>
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-2xl shadow-inner ${pResult?.isAccepted ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : pResult && pResult.failedAttempts > 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-800/80 text-slate-300 border border-slate-700'}`}>
                                                            {String.fromCharCode(65 + idx)}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-xl text-slate-100">{p.title}</h3>
                                                            <div className="text-sm mt-1 flex items-center gap-3">
                                                                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${p.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-400' : p.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-400'}`}>
                                                                    {p.difficulty || 'Bình thường'}
                                                                </span>
                                                                <span className="text-slate-400 font-medium">{pResult ? pResult.score : 0} <span className="text-slate-500">/ 100 Điểm</span></span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1 text-sm font-medium">
                                                        {pResult ? (
                                                            <>
                                                                <div className={`flex items-center gap-1.5 ${pResult.isAccepted ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                    {pResult.isAccepted ? <CheckCircle weight="fill" className="text-lg" /> : <Clock weight="fill" className="text-lg" />}
                                                                    {pResult.isAccepted ? 'Accepted' : 'Failed'}
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
                                        {leaderboard.slice(0, 5).map((u) => (
                                            <div key={u.userId} className={`flex items-center gap-4 p-4 transition-colors ${u.userId === user?.id ? 'bg-blue-900/30' : 'hover:bg-slate-800/40'}`}>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${u.rank === 1 ? 'bg-yellow-500/20 text-yellow-500' : u.rank === 2 ? 'bg-slate-300/20 text-slate-300' : u.rank === 3 ? 'bg-amber-600/20 text-amber-500' : 'bg-slate-800 text-slate-400'}`}>
                                                    {u.rank}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold text-slate-200 truncate">{u.fullName}</div>
                                                    <div className="text-xs text-slate-500 flex gap-2">
                                                        <span className="text-yellow-500 font-bold">{u.totalScore} điểm</span>
                                                        <span>•</span>
                                                        <span className="text-emerald-400">{u.totalSolved} bài</span>
                                                        <span>•</span>
                                                        <span>{u.totalPenalty}m</span>
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
            </main>

            {/* Footer */}
            <footer className="bg-slate-900/60 backdrop-blur-xl border-t border-slate-800 py-8 px-6 z-10 relative">
                <div className="container mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 text-2xl font-bold tracking-tighter">
                        <Code weight="fill" className="text-blue-500 text-3xl" />
                        <span className="text-white">Code<span className="text-blue-500">Arena</span></span>
                    </div>
                    <div className="text-slate-500 text-sm">
                        &copy; 2026 Code Arena Platform. All rights reserved.
                    </div>
                    <div className="flex gap-4">
                        <a href="https://www.facebook.com/" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-blue-600 transition-colors">
                            <FacebookLogo weight="fill" className="text-xl" />
                        </a>
                        <a href="https://x.com/" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-blue-400 transition-colors">
                            <TwitterLogo weight="fill" className="text-xl" />
                        </a>
                        <a href="https://github.com/C0825G1-Org/C0825G1-code-arena" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                            <GithubLogo weight="fill" className="text-xl" />
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
};
