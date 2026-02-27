import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../../app/store';
import { logout } from '../../../auth/store/authSlice';
import { contestService, ContestListItem } from '../../home/services/contestService';
import { toast } from 'react-hot-toast';
import {
    Code, Bell, SignOut, ShieldStar,
    CalendarStar, Users, Clock, ArrowRight,
    CircleNotch, Trophy, XCircle
} from '@phosphor-icons/react';

const statusConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
    active: { label: 'Đang diễn ra', bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
    upcoming: { label: 'Sắp tới', bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
    finished: { label: 'Đã kết thúc', bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' },
};

const getTimeLeft = (targetTime: string, serverTime?: string): string => {
    const now = serverTime ? new Date(serverTime) : new Date();
    const target = new Date(targetTime);
    const diffMs = target.getTime() - now.getTime();

    if (diffMs <= 0) return 'Đã hết';

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days} ngày ${hours}h nữa`;
    if (hours > 0) return `${hours}h ${minutes}p nữa`;
    return `${minutes} phút nữa`;
};

export const UserContestsPage = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const userRole = user?.role?.replace('ROLE_', '').toUpperCase() || '';
    const isModerator = userRole === 'MODERATOR' || userRole === 'ADMIN';

    const [contests, setContests] = useState<ContestListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [registeringId, setRegisteringId] = useState<number | null>(null);

    const [filterStatus, setFilterStatus] = useState<string>('');

    const fetchContests = async () => {
        try {
            setLoading(true);
            const data = await contestService.getContests(filterStatus || undefined, 0, 50);
            // Sort by ID descending implicitly by API
            setContests(data.content || []);
        } catch (err) {
            console.error('Failed to fetch contests:', err);
            toast.error('Không thể tải danh sách cuộc thi');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContests();
    }, [filterStatus]);

    const handleLogout = () => {
        navigate('/');
        setTimeout(() => {
            dispatch(logout());
        }, 10);
    };

    const handleRegister = async (contestId: number) => {
        try {
            setRegisteringId(contestId);
            await contestService.registerForContest(contestId);
            toast.success('Đăng ký tham gia thành công!');
            await fetchContests(); // Refresh to get the updated isRegistered status
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi đăng ký.');
        } finally {
            setRegisteringId(null);
        }
    };

    // --- Dynamic Button Logic based on Requirements ---
    const renderActionButton = (contest: ContestListItem) => {
        const isReging = registeringId === contest.id;

        // Handle backend serialization discrepancy (isRegistered vs registered)
        const userIsRegistered = contest.isRegistered || (contest as any).registered;

        // Condition 4: Finished -> Xem kết quả
        if (contest.status === 'finished') {
            return (
                <button
                    disabled
                    className="w-full sm:w-auto px-5 py-2.5 rounded-lg font-medium bg-slate-700/50 text-slate-300 border border-slate-600/50 hover:bg-slate-600/50 transition-colors flex justify-center items-center cursor-pointer"
                >
                    Xem kết quả
                </button>
            );
        }

        // Condition 1: Not Registered -> Đăng ký
        if (!userIsRegistered) {
            return (
                <button
                    onClick={() => handleRegister(contest.id)}
                    disabled={isReging}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-medium bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/30 transition-all border border-purple-500 flex justify-center items-center gap-2"
                >
                    {isReging ? <CircleNotch className="animate-spin text-xl" /> : 'Đăng ký ngay'}
                </button>
            );
        }

        // --- Now they are Registered ---

        // Condition 2: Registered + UPCOMING -> Chưa diễn ra
        if (contest.status === 'upcoming') {
            return (
                <button
                    disabled
                    className="w-full sm:w-auto px-5 py-2.5 rounded-lg font-medium bg-slate-800 text-slate-400 border border-slate-700/50 cursor-not-allowed flex justify-center items-center"
                >
                    Chờ bắt đầu
                </button>
            );
        }

        // Condition 3: Registered + ACTIVE -> Vào thi (Vào thi sáng bực, gradient)
        if (contest.status === 'active') {
            return (
                <button
                    onClick={() => toast.success('Đang chuyển hướng vào phòng thi... (Coming soon)')}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-bold bg-gradient-to-r from-blue-500 to-emerald-400 hover:from-blue-400 hover:to-emerald-300 text-slate-900 shadow-[0_0_20px_rgba(56,189,248,0.4)] transition-all hover:scale-105 flex justify-center items-center gap-2"
                >
                    Vào Thi <ArrowRight weight="bold" />
                </button>
            );
        }

        return null; // Fallback
    };

    return (
        <div className="antialiased min-h-screen flex flex-col relative bg-[#0f172a] text-slate-50 font-sans overflow-x-hidden">
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
                        <Link to="/contests" className="text-white hover:text-blue-400 transition-colors pointer-events-none">Cuộc thi</Link>
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

            {/* Main Content */}
            <main className="flex-1 container mx-auto px-4 sm:px-6 py-8 sm:py-12 z-10 max-w-7xl">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight mb-3 flex items-center gap-3">
                            <CalendarStar weight="duotone" className="text-purple-400" />
                            Danh sách Cuộc thi
                        </h1>
                        <p className="text-slate-400 max-w-2xl text-lg">
                            Tham gia các kỳ thi lập trình để cọ xát kỹ năng thuật toán, tích lũy điểm thưởng và vươn lên trên bảng xếp hạng (Leaderboard).
                        </p>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2 w-full md:w-auto bg-slate-800/50 p-1.5 rounded-xl border border-slate-700/50 backdrop-blur-md">
                        {['', 'active', 'upcoming', 'finished'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 md:flex-none ${filterStatus === status
                                    ? 'bg-purple-600 text-white shadow-md'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                                    }`}
                            >
                                {status === '' ? 'Tất cả' : status === 'active' ? 'Đang diễn ra' : status === 'upcoming' ? 'Sắp tới' : 'Đã xong'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Contests List */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <CircleNotch weight="bold" className="text-4xl animate-spin text-purple-500 mb-4" />
                        <p>Đang tải danh sách cuộc thi...</p>
                    </div>
                ) : contests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-slate-800/20 border border-slate-700/30 rounded-2xl backdrop-blur-md">
                        <XCircle weight="duotone" className="text-6xl text-slate-500 mb-4" />
                        <h3 className="text-xl font-semibold text-slate-300">Không tìm thấy cuộc thi nào</h3>
                        <p className="text-slate-400 mt-2">Hãy thử thay đổi bộ lọc hoặc quay lại sau nhé.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5">
                        {contests.map((contest) => {
                            const badge = statusConfig[contest.status] || statusConfig.finished;

                            return (
                                <div
                                    key={contest.id}
                                    className={`relative overflow-hidden group bg-slate-800/40 backdrop-blur-md rounded-2xl p-5 sm:p-6 transition-all duration-300
                                                border ${contest.status === 'active' ? 'border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.1)]' : 'border-slate-700/50 hover:border-purple-500/30 hover:bg-slate-800/60'}
                                    `}
                                >
                                    {/* Subtle active glow */}
                                    {contest.status === 'active' && (
                                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 shadow-[0_0_20px_#3b82f6]"></div>
                                    )}

                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pl-2">

                                        {/* Info Section */}
                                        <div className="flex-1 space-y-3 p-1">
                                            <div className="flex items-center gap-3">
                                                <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider border ${badge.bg} ${badge.text} ${badge.border}`}>
                                                    {badge.label}
                                                </span>
                                                {contest.isRegistered && (
                                                    <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                                        Đã đăng ký
                                                    </span>
                                                )}
                                            </div>

                                            <Link to={`/contests/${contest.id}`}>
                                                <h3 className="text-2xl font-bold text-slate-100 group-hover:text-purple-300 transition-colors">
                                                    {contest.title}
                                                </h3>
                                            </Link>

                                            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-400 font-medium">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock weight="duotone" className="text-lg text-slate-500" />
                                                    {new Date(contest.startTime).toLocaleString('vi-VN')}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Users weight="duotone" className="text-lg text-slate-500" />
                                                    {contest.participantCount} người tham gia
                                                </div>
                                                {contest.status === 'upcoming' && (
                                                    <div className="flex items-center gap-1.5 text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                                                        Bắt đầu sau: {getTimeLeft(contest.startTime, contest.serverTime)}
                                                    </div>
                                                )}
                                                {contest.status === 'active' && (
                                                    <div className="flex items-center gap-1.5 text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                                                        <Trophy weight="duotone" /> Đang cạnh tranh
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <div className="md:w-[220px] flex justify-end shrink-0">
                                            {renderActionButton(contest)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
};
