import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../../app/store';
import { logout } from '../../../auth/store/authSlice';
import { contestService } from '../../home/services/contestService';
import { useContestWebSocket } from '../hooks/useContestWebSocket';
import { toast } from 'react-hot-toast';
import {
    Code, Bell, SignOut, ShieldStar, ArrowLeft,
    CalendarStar, Users, Clock, ArrowRight,
    CircleNotch, Trophy, WarningCircle, CheckCircle, Info, ChartBar
} from '@phosphor-icons/react';
import { LeaderboardTab } from '../components/LeaderboardTab';

// Status styling configuration
const statusConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
    active: { label: 'Đang diễn ra', bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
    upcoming: { label: 'Sắp tới', bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
    finished: { label: 'Đã kết thúc', bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' },
};

// Interface reflecting the API response
export interface ContestProblemData {
    id: number;
    orderIndex: number;
    title: string;
    difficulty: string;
    isFrozen: boolean;
    frozenReason: string;
}

export interface ContestDetailData {
    id: number;
    title: string;
    description: string;
    status: string;
    startTime: string;
    endTime: string;
    isRegistered?: boolean;
    registered?: boolean; // Fallback for backend serialization
    serverTime: string;
    participantCount: number;
    problems?: ContestProblemData[];
}

export const UserContestDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const userRole = user?.role?.replace('ROLE_', '').toUpperCase() || '';
    const isModerator = userRole === 'MODERATOR' || userRole === 'ADMIN';

    const [contest, setContest] = useState<ContestDetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);

    // Live Countdown state
    const [timeLeftStr, setTimeLeftStr] = useState<string>('');

    // Tab state
    const [activeTab, setActiveTab] = useState<'problems' | 'leaderboard'>('problems');

    const fetchContestDetail = async () => {
        try {
            const data = await contestService.getContestDetail(Number(id));
            setContest(data);
        } catch (err: any) {
            console.error('Failed to fetch contest detail:', err);
            toast.error('Không thể tải thông tin cuộc thi.');
            navigate('/contests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            setLoading(true);
            fetchContestDetail();
        }
    }, [id]);

    // WebSocket real-time updates for contest status
    const handleContestUpdate = useCallback((wsContestId: number, _newStatus: string) => {
        if (wsContestId === Number(id)) {
            fetchContestDetail(); // Hard refresh to get problems list securely from API
        }
    }, [id]);

    useContestWebSocket(handleContestUpdate);

    // Live Countdown Effect
    useEffect(() => {
        if (!contest || contest.status !== 'upcoming') return;

        // Calculate offset between local 'now' and serverTime once
        const localTimeAtFetch = new Date().getTime();
        const serverTimeAtFetch = new Date(contest.serverTime).getTime();
        const offset = serverTimeAtFetch - localTimeAtFetch;

        const targetTime = new Date(contest.startTime).getTime();

        const timer = setInterval(() => {
            const currentRealTime = new Date().getTime() + offset;
            const diffMs = targetTime - currentRealTime;

            if (diffMs <= 0) {
                clearInterval(timer);
                setTimeLeftStr('Đã đến giờ!');
                fetchContestDetail(); // Auto refresh!
            } else {
                const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

                if (days > 0) {
                    setTimeLeftStr(`${days} ngày ${hours}h nữa`);
                } else if (hours > 0) {
                    setTimeLeftStr(`${hours}h ${minutes}p nữa`);
                } else {
                    setTimeLeftStr(`${minutes}p ${seconds}s nữa`);
                }
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [contest]);

    const handleLogout = () => {
        navigate('/');
        setTimeout(() => dispatch(logout()), 10);
    };

    const handleRegister = async () => {
        if (!contest) return;
        try {
            setRegistering(true);
            await contestService.registerForContest(contest.id);
            toast.success('Đăng ký tham gia thành công!');
            await fetchContestDetail(); // Refresh immediately
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi đăng ký.');
        } finally {
            setRegistering(false);
        }
    };

    if (loading && !contest) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-slate-400">
                <div className="flex flex-col items-center gap-4">
                    <CircleNotch weight="bold" className="text-5xl animate-spin text-purple-500" />
                    <p className="font-medium">Đang tải chi tiết cuộc thi...</p>
                </div>
            </div>
        );
    }

    if (!contest) return null;

    const badge = statusConfig[contest.status] || statusConfig.finished;
    const userIsRegistered = contest.isRegistered || (contest as any).registered;

    // --- Action Button Logic ---
    const renderActionButton = () => {
        if (contest.status === 'finished') {
            return (
                <button
                    onClick={() => navigate(`/contests/${contest.id}/results`)}
                    className="w-full py-3.5 rounded-xl font-medium bg-slate-700/50 text-slate-300 border border-slate-600/50 cursor-pointer hover:bg-slate-600/50 transition-colors flex justify-center items-center"
                >
                    Xem kết quả
                </button>
            );
        }

        if (!userIsRegistered) {
            return (
                <button
                    onClick={handleRegister}
                    disabled={registering}
                    className="w-full py-3.5 rounded-xl text-lg font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-xl shadow-purple-500/30 transition-all border border-purple-500 flex justify-center items-center gap-2"
                >
                    {registering ? <CircleNotch className="animate-spin text-2xl" /> : 'Đăng ký ngay'}
                </button>
            );
        }

        if (contest.status === 'upcoming') {
            return (
                <button
                    disabled
                    className="w-full py-3.5 rounded-xl font-medium bg-slate-800 text-slate-400 border border-slate-700/50 cursor-not-allowed flex justify-center items-center gap-2"
                >
                    <Clock weight="duotone" className="text-xl" /> Chờ bắt đầu
                </button>
            );
        }

        // Active State
        // Nếu contest có bài tập, lấy bài đầu tiên hoặc ẩn nút này
        const firstProblemId = contest.problems && contest.problems.length > 0 ? contest.problems[0].id : 1;
        return (
            <button
                onClick={() => navigate('/code-editor/' + firstProblemId + '?contestId=' + contest.id)}
                className="w-full py-3.5 rounded-xl text-lg font-extrabold bg-gradient-to-r from-blue-500 to-emerald-400 hover:from-blue-400 hover:to-emerald-300 text-slate-900 shadow-[0_0_25px_rgba(56,189,248,0.5)] transition-all hover:scale-[1.02] flex justify-center items-center gap-2"
            >
                Vào Thi (Bài Đầu) <ArrowRight weight="bold" />
            </button>
        );
    };

    return (
        <div className="antialiased min-h-screen flex flex-col relative bg-[#0f172a] text-slate-50 font-sans overflow-x-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-purple-900/20 to-transparent pointer-events-none" />
            <div className="absolute top-[10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none" />
            <div className="absolute right-[-5%] top-[20%] w-[30%] h-[40%] bg-purple-600/10 blur-[130px] rounded-full pointer-events-none" />

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
                        <Link to="/discussions" className="hover:text-blue-400 transition-colors">Thảo luận</Link>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {isModerator && (
                        <Link to={userRole === 'ADMIN' ? '/admin/dashboard' : '/moderator/dashboard'} className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-600/20 text-purple-300 hover:bg-purple-600/40 transition-all text-sm font-medium border border-purple-500/20">
                            <ShieldStar weight="duotone" className="text-lg" /> <span>Quản trị</span>
                        </Link>
                    )}
                    <button className="p-2 rounded-full hover:bg-slate-800 transition-colors text-slate-300"><Bell className="text-xl" /></button>
                    <Link to="/profile" className="flex items-center gap-3 cursor-pointer group pl-3 border-l border-slate-700 hover:bg-slate-800/50 p-2 rounded-xl transition-colors">
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">{user?.fullName || 'User'}</div>
                            <div className="text-xs text-slate-400 font-mono">Rating: <span className="text-yellow-400">1550</span></div>
                        </div>
                        <img src={`https://i.pravatar.cc/150?u=${user?.id || 1}`} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-blue-500/50 object-cover" />
                    </Link>
                    <button onClick={handleLogout} className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors border border-red-500/20 bg-red-500/5"><SignOut weight="bold" className="text-xl" /></button>
                </div>
            </nav>

            <main className="flex-1 container mx-auto px-4 sm:px-6 py-8 z-10 max-w-6xl">
                {/* Back Link */}
                <Link to="/contests" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 font-medium">
                    <ArrowLeft weight="bold" /> Quay lại danh sách
                </Link>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Column: Main Info */}
                    <div className="flex-1 space-y-8">
                        {/* Header Hero */}
                        <div className="bg-slate-800/40 backdrop-blur-md rounded-3xl p-8 sm:p-10 border border-slate-700/50 relative overflow-hidden">
                            {contest.status === 'active' && (
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 shadow-[0_0_20px_#3b82f6]" />
                            )}

                            <div className="flex flex-wrap items-center gap-4 mb-4">
                                <span className={`px-3 py-1 rounded-md text-sm font-bold uppercase tracking-wider border ${badge.bg} ${badge.text} ${badge.border}`}>
                                    {badge.label}
                                </span>
                                {userIsRegistered && (
                                    <span className="px-3 py-1 rounded-md text-sm font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                                        <CheckCircle weight="bold" /> Đã đăng ký
                                    </span>
                                )}
                            </div>

                            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
                                {contest.title}
                            </h1>

                            <div className="flex flex-wrap items-center gap-6 text-slate-300 font-medium">
                                <div className="flex items-center gap-2">
                                    <Clock weight="duotone" className="text-2xl text-slate-400" />
                                    <span>
                                        Bắt đầu: <span className="text-white">{new Date(contest.startTime).toLocaleString('vi-VN')}</span>
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock weight="duotone" className="text-2xl text-slate-400" />
                                    <span>
                                        Kết thúc: <span className="text-white">{new Date(contest.endTime).toLocaleString('vi-VN')}</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Description Section */}
                        <div className="bg-slate-800/30 rounded-3xl p-8 sm:p-10 border border-slate-700/30">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <Info weight="duotone" className="text-blue-400" /> Giới thiệu kỳ thi
                            </h2>
                            <div className="prose prose-invert max-w-none text-slate-300">
                                {contest.description ? (
                                    <div className="whitespace-pre-wrap leading-relaxed text-lg">
                                        {contest.description}
                                    </div>
                                ) : (
                                    <p className="italic text-slate-500">Kỳ thi này hiện chưa có mô tả chi tiết.</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-slate-800/30 rounded-3xl p-8 sm:p-10 border border-slate-700/30">
                            {/* Tab Navigation */}
                            <div className="flex items-center gap-6 mb-8 border-b border-slate-700/50 pb-4">
                                <button
                                    onClick={() => setActiveTab('problems')}
                                    className={`flex items-center gap-2 text-xl font-bold transition-colors ${activeTab === 'problems'
                                        ? 'text-emerald-400 border-b-2 border-emerald-400 pb-2'
                                        : 'text-slate-400 hover:text-slate-200 pb-2 border-b-2 border-transparent'
                                        }`}
                                >
                                    <Code weight="duotone" className="text-2xl" /> Danh sách bài tập
                                </button>
                                <button
                                    onClick={() => setActiveTab('leaderboard')}
                                    className={`flex items-center gap-2 text-xl font-bold transition-colors ${activeTab === 'leaderboard'
                                        ? 'text-blue-400 border-b-2 border-blue-400 pb-2'
                                        : 'text-slate-400 hover:text-slate-200 pb-2 border-b-2 border-transparent'
                                        }`}
                                >
                                    <ChartBar weight="duotone" className="text-2xl" /> Bảng xếp hạng
                                </button>
                            </div>

                            {/* Problems Tab Content */}
                            {activeTab === 'problems' && (
                                contest.problems.length > 0 ? (
                                    <div className="space-y-4">
                                        {contest.problems.sort((a, b) => a.orderIndex - b.orderIndex).map((p, idx) => (
                                            <div key={p.id} className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-5 flex items-center justify-between hover:border-emerald-500/50 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center font-black text-2xl text-slate-300 shadow-inner">
                                                        {String.fromCharCode(65 + idx)} {/* A, B, C... */}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-xl text-slate-100">{p.title}</h3>
                                                        <div className="text-sm mt-1 flex items-center gap-3">
                                                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${p.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-400' : p.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-400'}`}>
                                                                {p.difficulty || 'Bình thường'}
                                                            </span>
                                                            <span className="text-slate-500 font-medium">100 Điểm</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 flex-shrink-0">
                                                    {p.isFrozen && (
                                                        <span className="text-blue-400 text-sm font-semibold italic flex items-center gap-1">
                                                            ❄️ Đóng băng
                                                        </span>
                                                    )}
                                                    <button
                                                        onClick={() => navigate(`/code-editor/${p.id}?contestId=${contest.id}`)}
                                                        className="px-6 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all hover:scale-105 shadow-md flex items-center gap-2 border border-blue-500/50"
                                                    >
                                                        Giải bài <ArrowRight weight="bold" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-8 text-center">
                                        <p className="text-slate-400">Không có bài tập nào trong cuộc thi này hoặc ban tổ chức chưa thêm bài.</p>
                                    </div>
                                )
                            )}

                            {/* Leaderboard Tab Content */}
                            {activeTab === 'leaderboard' && (
                                <LeaderboardTab contestId={contest.id} />
                            )}
                        </div>
                    </div>

                    {/* Right Column: Sticky Sidebar Area */}
                    <div className="w-full lg:w-[380px] shrink-0 space-y-6">

                        {/* Registration Card */}
                        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-600/40 sticky top-[100px] shadow-2xl">

                            {/* Countdown / Status emphasis */}
                            <div className="text-center mb-8 pb-8 border-b border-slate-700/50">
                                {contest.status === 'active' ? (
                                    <div className="animate-pulse">
                                        <Trophy weight="duotone" className="text-6xl text-yellow-500 mx-auto mb-3" />
                                        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                                            Đang diễn ra!
                                        </h3>
                                    </div>
                                ) : contest.status === 'upcoming' ? (
                                    <div>
                                        <CalendarStar weight="duotone" className="text-5xl text-purple-400 mx-auto mb-3" />
                                        <h3 className="text-slate-400 font-medium mb-1">Bắt đầu sau</h3>
                                        <div className="text-2xl font-bold text-white">
                                            {timeLeftStr || 'Đang tải...'}
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="text-5xl mb-3">🏁</div>
                                        <h3 className="text-xl font-bold text-slate-300">Đã kết thúc</h3>
                                    </div>
                                )}
                            </div>

                            {/* Action Button */}
                            <div className="mb-6">
                                {renderActionButton()}
                            </div>

                            {/* Stats */}
                            <div className="bg-slate-900/50 rounded-2xl p-4 flex items-center justify-between border border-slate-700/50">
                                <div className="flex items-center gap-3 text-slate-300">
                                    <div className="p-2 bg-blue-500/20 rounded-lg">
                                        <Users weight="bold" className="text-blue-400 text-xl" />
                                    </div>
                                    <span className="font-medium">Số thí sinh</span>
                                </div>
                                <span className="text-2xl font-bold text-white">{contest.participantCount}</span>
                            </div>

                        </div>

                        {/* Rules / Notes Placeholder */}
                        <div className="bg-slate-800/30 rounded-3xl p-6 border border-slate-700/30">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-200">
                                <WarningCircle weight="bold" className="text-yellow-500" /> Lưu ý quan trọng
                            </h3>
                            <ul className="text-sm text-slate-400 space-y-3 list-disc pl-5">
                                <li>Nghiêm cấm mọi hành vi gian lận, sao chép code.</li>
                                <li>Hệ thống tự động chấm bằng trình biên dịch chuẩn.</li>
                                <li>Chỉ tính điểm cho submissions hoàn toàn đúng (AC).</li>
                                <li>Penalty tính theo số lần nộp sai và thời gian giải.</li>
                            </ul>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};
