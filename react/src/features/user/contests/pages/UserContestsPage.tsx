import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../../app/store';
import { logout } from '../../../auth/store/authSlice';
import { contestService, ContestListItem } from '../../home/services/contestService';
import { useContestWebSocket } from '../hooks/useContestWebSocket';
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

    // Filter & Pagination States
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    const fetchContests = useCallback(async () => {
        try {
            setLoading(true);
            const params: any = { size: 6, page: page, sort: 'startTime,desc' };
            if (filterStatus) params.status = filterStatus;
            if (searchTerm) params.title = searchTerm;
            if (startTime) params.startTime = new Date(startTime).toISOString();
            if (endTime) {
                const end = new Date(endTime);
                end.setHours(23, 59, 59, 999);
                if (!isNaN(end.getTime())) {
                    params.endTime = end.toISOString();
                }
            }

            const data = await contestService.getContests(params);
            setContests(data.content || []);
            setTotalPages(data.totalPages || 0);
            setTotalElements(data.totalElements || 0);
        } catch (err) {
            console.error('Failed to fetch contests:', err);
            toast.error('Không thể tải danh sách cuộc thi');
        } finally {
            setLoading(false);
        }
    }, [page, filterStatus, searchTerm, startTime, endTime]);

    // Keep latest fetchContests for websocket callbacks (avoid stale closure).
    const fetchContestsRef = useRef(fetchContests);
    useEffect(() => {
        fetchContestsRef.current = fetchContests;
    }, [fetchContests]);

    useEffect(() => {
        fetchContests();
    }, [filterStatus, page]);

    // WebSocket real-time updates for contest status
    const handleContestStatusUpdate = useCallback((_wsContestId: number, _newStatus: string) => {
        // Refetch to ensure status badges/buttons update without full page reload.
        fetchContestsRef.current();
    }, []);

    useContestWebSocket(handleContestStatusUpdate);

    // Fallback realtime: when local time passes contest start/end, refetch once.
    useEffect(() => {
        if (!contests.length) return;

        const timer = setInterval(() => {
            const now = Date.now();
            let shouldRefresh = false;

            for (const contest of contests) {
                const start = new Date(contest.startTime).getTime();
                const end = new Date(contest.endTime).getTime();
                if (Number.isNaN(start) || Number.isNaN(end)) continue;

                if (contest.status === 'upcoming' && now >= start) {
                    shouldRefresh = true;
                    break;
                }
                if (contest.status === 'active' && now >= end) {
                    shouldRefresh = true;
                    break;
                }
            }

            if (shouldRefresh) {
                fetchContestsRef.current();
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [contests]);

    const handleSearchClick = () => {
        if (page === 0) fetchContests();
        else setPage(0);
    };

    const handleResetFilters = async () => {
        setSearchTerm('');
        setFilterStatus('');
        setStartTime('');
        setEndTime('');
        setPage(0);

        try {
            setLoading(true);
            const data = await contestService.getContests({ size: 6, page: 0, sort: 'startTime,desc' });
            setContests(data.content || []);
            setTotalPages(data.totalPages || 0);
            setTotalElements(data.totalElements || 0);
        } catch (err) {
            console.error('Failed to reset contests:', err);
            // toast is already imported and used elsewhere
        } finally {
            setLoading(false);
        }
    };

    const renderPageNumbers = () => {
        if (totalPages <= 1) return null;
        const pages = [];
        for (let i = 0; i < totalPages; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`min-w-[44px] h-[44px] flex items-center justify-center rounded-xl font-bold transition-all duration-300 mx-1 ${page === i
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/40 text-white transform -translate-y-1'
                        : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700/50 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20'
                        }`}
                >
                    {i + 1}
                </button>
            );
        }
        return (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-12 mb-8 gap-6 max-w-4xl mx-auto w-full bg-slate-800/30 p-4 rounded-3xl border border-white/5 backdrop-blur-sm">
                <div className="text-slate-400 font-medium px-4">
                    Hiển thị <span className="text-white font-bold">{contests.length}</span> / <span className="text-blue-400 font-bold">{totalElements}</span> cuộc thi
                </div>
                <div className="flex items-center flex-wrap justify-center gap-y-3">
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="h-[44px] px-4 rounded-xl flex items-center justify-center font-bold text-slate-400 bg-slate-800/80 hover:bg-slate-700 hover:text-white border border-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all mr-2"
                    >
                        Trang trước
                    </button>
                    {pages}
                    <button
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        className="h-[44px] px-4 rounded-xl flex items-center justify-center font-bold text-slate-400 bg-slate-800/80 hover:bg-slate-700 hover:text-white border border-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all ml-2"
                    >
                        Trang sau
                    </button>
                </div>
            </div>
        );
    };

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
                    onClick={() => navigate(`/contests/${contest.id}/results`)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-lg font-medium bg-slate-700/50 text-slate-300 border border-slate-600/50 hover:bg-slate-600/50 transition-colors flex justify-center items-center cursor-pointer"
                >
                    Xem kết quả
                </button>
            );
        }

        // Condition 1: Not Registered -> Đăng ký
        if (!userIsRegistered) {
            const isFull = contest.participantCount >= contest.maxParticipants;
            if (isFull) {
                return (
                    <button
                        disabled
                        className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-medium bg-slate-800 text-slate-400 border border-slate-700/50 cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        Đã hết chỗ
                    </button>
                );
            }
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
            const destUrl = contest.firstProblemId
                ? `/code-editor/${contest.firstProblemId}?contestId=${contest.id}`
                : `/contests/${contest.id}`;

            return (
                <button
                    onClick={() => navigate(destUrl)}
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
                <div className="flex flex-col mb-10">
                    <div className="mb-8 text-center sm:text-left">
                        <h1 className="text-5xl font-black tracking-tight flex items-center justify-center sm:justify-start gap-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 pb-2 leading-tight">
                            <CalendarStar weight="duotone" className="text-blue-500 shrink-0" />
                            Danh sách cuộc thi
                        </h1>
                        <p className="text-slate-400 max-w-2xl text-lg mx-auto sm:mx-0 font-medium mt-2">
                            Tham gia các kỳ thi lập trình để cọ xát kỹ năng thuật toán, tích lũy điểm thưởng và vươn lên trên bảng xếp hạng (Leaderboard) nhanh chóng.
                        </p>
                    </div>

                    {/* Filters & Search - Vibrant and Youthful */}
                    <div className="w-full relative bg-slate-800/40 p-5 md:p-6 rounded-3xl border border-white/5 backdrop-blur-xl shadow-[0_20px_40px_-15px_rgba(79,70,229,0.15)] flex flex-col gap-6">

                        {/* Shimmer Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite] pointer-events-none rounded-3xl overflow-hidden"></div>

                        {/* Top Row: Search & Dates */}
                        <div className="flex flex-col lg:flex-row gap-5 z-10 w-full">
                            {/* Search Bar */}
                            <div className="flex-1 relative group bg-slate-900/60 rounded-2xl border border-slate-700/50 flex items-center h-[56px] shadow-inner overflow-hidden">
                                <div className="absolute left-0 pl-5 flex items-center pointer-events-none">
                                    <i className="ph-bold ph-magnifying-glass text-xl text-blue-400 group-focus-within:text-purple-400 transition-colors"></i>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Tìm tên cuộc thi (VD: Contest Module 1)..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
                                    className="w-full h-full bg-transparent text-white text-[15px] focus:ring-2 focus:ring-purple-500/50 block pl-14 pr-5 transition-all outline-none placeholder-slate-500"
                                />
                            </div>

                            {/* Date Filters */}
                            <div className="flex gap-4 flex-col sm:flex-row lg:w-auto overflow-visible">
                                <div className="relative group sm:w-48 xl:w-56 bg-slate-900/60 rounded-2xl border border-slate-700/50 flex items-center h-[56px] shadow-inner overflow-hidden">
                                    <div className="absolute left-0 pl-4 flex items-center pointer-events-none text-emerald-400 bg-slate-900/60 lg:bg-transparent h-full z-10">
                                        <i className="ph-duotone ph-calendar-plus text-[22px]"></i>
                                    </div>
                                    <input
                                        type="date"
                                        value={startTime}
                                        title="Từ ngày"
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="w-full h-full bg-transparent text-slate-300 text-[15px] focus:ring-2 focus:ring-emerald-500/50 block pl-[3.4rem] pr-3 outline-none cursor-text appearance-none transition-all"
                                    />
                                </div>
                                <div className="relative group sm:w-48 xl:w-56 bg-slate-900/60 rounded-2xl border border-slate-700/50 flex items-center h-[56px] shadow-inner overflow-hidden">
                                    <div className="absolute left-0 pl-4 flex items-center pointer-events-none text-rose-400 bg-slate-900/60 lg:bg-transparent h-full z-10">
                                        <i className="ph-duotone ph-calendar-check text-[22px]"></i>
                                    </div>
                                    <input
                                        type="date"
                                        value={endTime}
                                        title="Đến ngày"
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="w-full h-full bg-transparent text-slate-300 text-[15px] focus:ring-2 focus:ring-rose-500/50 block pl-[3.4rem] pr-3 outline-none cursor-text appearance-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Bottom Row: Status & Actions */}
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-5 z-10 w-full mt-2">
                            {/* Status Pills */}
                            <div className="flex items-center gap-3 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide w-full lg:w-auto">
                                {[
                                    { val: '', label: '⚡ Tất cả' },
                                    { val: 'active', label: '🔥 Đang mở' },
                                    { val: 'upcoming', label: '⏳ Sắp tới' },
                                    { val: 'finished', label: '🏁 Đã xong' }
                                ].map(st => (
                                    <button
                                        key={st.val}
                                        onClick={() => { setFilterStatus(st.val); setPage(0); }}
                                        className={`h-[48px] px-6 rounded-xl text-[15px] font-bold transition-all whitespace-nowrap border ${filterStatus === st.val
                                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-indigo-500/50 text-white shadow-[0_4px_16px_rgba(79,70,229,0.3)] transform -translate-y-[2px]'
                                            : 'bg-slate-900/40 text-slate-400 border-slate-700/50 hover:border-slate-500 hover:text-slate-200 hover:bg-slate-800'
                                            }`}
                                    >
                                        {st.label}
                                    </button>
                                ))}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4 w-full lg:w-auto">
                                <button
                                    onClick={handleResetFilters}
                                    className="h-[48px] px-6 lg:w-[60px] lg:px-0 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700 flex items-center justify-center group shrink-0 shadow-md hover:shadow-lg w-full sm:w-auto"
                                    title="Làm mới bộ lọc"
                                >
                                    <i className="ph-bold ph-arrows-counter-clockwise text-[22px] group-hover:-rotate-180 transition-transform duration-700"></i>
                                </button>
                                <button
                                    onClick={handleSearchClick}
                                    className="h-[48px] px-8 rounded-xl font-black bg-white text-slate-900 hover:bg-slate-100 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transform hover:-translate-y-[2px] w-full sm:flex-1 lg:w-auto tracking-wide"
                                >
                                    <i className="ph-bold ph-paper-plane-right text-xl"></i>
                                    <span>TÌM KIẾM</span>
                                </button>
                            </div>
                        </div>
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
                    <div className="flex flex-col gap-6">
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
                                                        <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                                            🌟 Đã tham gia
                                                        </span>
                                                    )}
                                                </div>

                                                <Link to={`/contests/${contest.id}`}>
                                                    <h3 className="text-2xl font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
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
                                                        {contest.participantCount} / {contest.maxParticipants} người tham gia
                                                    </div>
                                                    {contest.status === 'upcoming' && (
                                                        <div className="flex items-center gap-1.5 text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                                                            Bắt đầu sau: {getTimeLeft(contest.startTime, contest.serverTime)}
                                                        </div>
                                                    )}
                                                    {contest.status === 'active' && (
                                                        <div className="flex items-center gap-1.5 text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 font-bold animate-pulse">
                                                            <Trophy weight="duotone" /> Đang cạnh tranh
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <div className="md:w-[220px] flex justify-end shrink-0 z-10 relative">
                                                {renderActionButton(contest)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {renderPageNumbers()}
                    </div>
                )}
            </main>
        </div>
    );
};
