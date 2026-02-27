import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { RootState } from '../../../../app/store';
import { logout } from '../../../auth/store/authSlice';
import { contestService, ContestListItem } from '../services/contestService';
import { useContestWebSocket } from '../../contests/hooks/useContestWebSocket';
import {
    Code,
    Bell,
    SignOut,
    ArrowRight,
    CalendarStar,
    Fire,
    Ranking,
    CheckCircle,
    Target,
    Clock,
    Calendar,
    ShieldStar,
    FacebookLogo,
    TwitterLogo,
    GithubLogo,
    HourglassLow,
    Trophy,
    CircleNotch
} from '@phosphor-icons/react';

// Tính thời gian còn lại
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

// Badge theo status
const statusConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
    active: { label: 'Đang diễn ra', bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
    upcoming: { label: 'Sắp tới', bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
    finished: { label: 'Đã kết thúc', bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' },
};

export const UserHomePage: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const userRole = user?.role?.replace('ROLE_', '').toUpperCase() || '';
    const isModerator = userRole === 'MODERATOR' || userRole === 'ADMIN';

    // Fetch real contests
    const [contests, setContests] = useState<ContestListItem[]>([]);
    const [loadingContests, setLoadingContests] = useState(true);
    const [registeringId, setRegisteringId] = useState<number | null>(null);

    const fetchContests = useCallback(async () => {
        try {
            const data = await contestService.getContests({ page: 0, size: 5 });
            setContests(data.content || []);
        } catch (err) {
            console.error('Failed to fetch contests:', err);
        } finally {
            setLoadingContests(false);
        }
    }, []);

    // Keep latest fetchContests for websocket callbacks (avoid stale closure).
    const fetchContestsRef = useRef(fetchContests);
    useEffect(() => {
        fetchContestsRef.current = fetchContests;
    }, [fetchContests]);

    useEffect(() => {
        fetchContests();
    }, []);

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

    const handleLogout = () => {
        navigate('/');
        setTimeout(() => {
            dispatch(logout());
        }, 10);
    };

    // Phân loại contests để hiển thị trên Home
    // Theo yêu cầu: hiển thị các cuộc thi sắp tới (upcoming)
    // VÀ chỉ hiển thị cuộc thi đang diễn ra (active) NẾU user đã đăng ký
    const displayContests = contests.filter(c => {
        if (c.status === 'upcoming') return true;
        if (c.status === 'active' && c.isRegistered) return true;
        return false;
    }).slice(0, 3);

    // Badge status dùng để hiển thị trên hero (chỉ lấy cuộc thi đang diễn ra, nếu là admin thì kệ, nhưng logic chung cứ lấy active đầu tiên)
    const activeContests = contests.filter(c => c.status === 'active');
    const upcomingContests = contests.filter(c => c.status === 'upcoming');

    const handleRegister = async (contestId: number) => {
        import('react-hot-toast').then(({ toast }) => {
            setRegisteringId(contestId);
            contestService.registerForContest(contestId)
                .then(() => {
                    toast.success('Đăng ký tham gia thành công!');
                    fetchContests(); // Refresh
                })
                .catch((error: any) => {
                    toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi đăng ký.');
                    setRegisteringId(null);
                });
        });
    };

    const renderActionButton = (contest: ContestListItem) => {
        const isReging = registeringId === contest.id;
        const userIsRegistered = contest.isRegistered || (contest as any).registered;

        if (contest.status === 'finished') {
            return (
                <Link to={`/contests/${contest.id}`} className="px-5 py-2.5 rounded-lg font-medium bg-slate-700/50 text-slate-300 border border-slate-600/50 hover:bg-slate-600/50 transition-colors whitespace-nowrap">
                    Xem kết quả
                </Link>
            );
        }

        if (!userIsRegistered) {
            return (
                <button
                    onClick={() => handleRegister(contest.id)}
                    disabled={isReging}
                    className="px-6 py-2.5 rounded-lg font-medium bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/30 transition-all border border-purple-500 flex justify-center items-center gap-2 whitespace-nowrap"
                >
                    {isReging ? <CircleNotch className="animate-spin text-xl" /> : 'Đăng ký ngay'}
                </button>
            );
        }

        if (contest.status === 'upcoming') {
            return (
                <Link to={`/contests/${contest.id}`} className="px-5 py-2.5 rounded-lg font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/50 transition-colors whitespace-nowrap">
                    Xem chi tiết
                </Link>
            );
        }

        if (contest.status === 'active') {
            return (
                <button
                    onClick={() => import('react-hot-toast').then(({ toast }) => toast.success('Đang chuyển hướng vào phòng thi... (Coming soon)'))}
                    className="px-6 py-2.5 rounded-lg font-bold bg-gradient-to-r from-blue-500 to-emerald-400 hover:from-blue-400 hover:to-emerald-300 text-slate-900 shadow-[0_0_20px_rgba(56,189,248,0.4)] transition-all hover:scale-105 flex justify-center items-center gap-2 whitespace-nowrap"
                >
                    Vào Thi <ArrowRight weight="bold" />
                </button>
            );
        }
        return null;
    };

    return (
        <div className="antialiased min-h-screen flex flex-col relative bg-[#0f172a] text-slate-50 font-sans overflow-clip">
            {/* Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />

            {/* Navbar */}
            <nav className="sticky top-0 z-50 px-6 py-4 flex justify-between items-center border-b border-white/10 bg-slate-900/60 backdrop-blur-xl">
                <div className="flex items-center gap-8">
                    <Link to="/home" className="flex items-center gap-2 text-2xl font-bold tracking-tighter">
                        <Code weight="fill" className="text-blue-500 text-3xl" />
                        <span className="text-white">Code<span className="text-blue-500">Arena</span></span>
                    </Link>
                    <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
                        <Link to="/home" className="text-white hover:text-blue-400 transition-colors">Trang chủ</Link>
                        <Link to="/problems" className="hover:text-blue-400 transition-colors">Bài tập</Link>
                        <Link to="/contests" className="hover:text-blue-400 transition-colors">Cuộc thi</Link>
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

                    <Link
                        to="/profile"
                        className="flex items-center gap-3 cursor-pointer group pl-3 border-l border-slate-700 hover:bg-slate-800/50 p-2 rounded-xl transition-colors"
                    >
                        <div className="text-right hidden sm:block">
                            <div
                                className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                                {user?.fullName || 'User'}
                            </div>
                            <div className="text-xs text-slate-400 font-mono">Rating: <span
                                className="text-yellow-400">1550</span>
                            </div>
                        </div>
                        <img
                            src={`https://i.pravatar.cc/150?u=${user?.id || 1}`}
                            alt="Avatar"
                            className="w-10 h-10 rounded-full border-2 border-blue-500/50 object-cover"
                        />
                    </Link>

                    <button
                        onClick={handleLogout}
                        title="Đăng xuất"
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors border border-red-500/20 bg-red-500/5 hover:border-red-500/50"
                    >
                        <SignOut weight="bold" className="text-xl" />
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 container mx-auto px-6 py-10 z-10 max-w-7xl">

                {/* Hero Section */}
                <div className="mb-16 mt-8 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="flex-1 space-y-6">
                        {/* Live Contest Badge — từ API thực */}
                        {activeContests.length > 0 ? (
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-sm text-blue-400 font-medium">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                                </span>
                                {activeContests[0].title} đang diễn ra
                            </div>
                        ) : upcomingContests.length > 0 ? (
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-sm text-purple-400 font-medium">
                                <HourglassLow weight="duotone" className="text-lg" />
                                {upcomingContests[0].title} sắp bắt đầu
                            </div>
                        ) : null}

                        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
                            Chào, {user?.fullName || 'Bạn'}! <br />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                                Sẵn Sàng Thi Đấu?
                            </span>
                        </h1>

                        <p className="text-lg text-slate-400 max-w-xl">
                            Tham gia nền tảng thi đấu lập trình hàng đầu. Giải quyết các bài toán hóc búa, rèn luyện tư duy logic và cạnh tranh với hàng ngàn lập trình viên khác.
                        </p>

                        <div className="flex gap-4 pt-4">
                            <Link
                                to="/problems"
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2"
                            >
                                Bắt đầu giải bài <ArrowRight weight="bold" />
                            </Link>
                            <Link
                                to="/leaderboard"
                                className="px-6 py-3 bg-slate-800/50 backdrop-blur-md hover:bg-slate-700 text-white font-medium rounded-lg transition-all flex items-center gap-2 border border-slate-700"
                            >
                                Xem Leaderboard
                            </Link>
                        </div>
                    </div>

                    {/* Stats Widget — chưa có API, hiển thị placeholder */}
                    <div className="w-full md:w-[400px] bg-slate-800/40 backdrop-blur-lg p-6 rounded-2xl flex flex-col gap-6 relative overflow-hidden group border border-blue-500/20">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        <div className="flex justify-between items-center relative z-10">
                            <h3 className="font-semibold text-lg text-white/90">Tiến Độ Của Bạn</h3>
                            <span className="text-xs text-slate-500 italic">Sắp ra mắt</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 relative z-10 opacity-50">
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                <Ranking weight="duotone" className="text-3xl mb-2 text-yellow-400" />
                                <div className="text-2xl font-bold">—</div>
                                <div className="text-xs text-slate-400">Elo Ranking</div>
                            </div>
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                <CheckCircle weight="duotone" className="text-3xl mb-2 text-emerald-400" />
                                <div className="text-2xl font-bold">—</div>
                                <div className="text-xs text-slate-400">Bài đã giải</div>
                            </div>
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                <Target weight="duotone" className="text-3xl mb-2 text-blue-400" />
                                <div className="text-2xl font-bold">—</div>
                                <div className="text-xs text-slate-400">Tỉ lệ AC</div>
                            </div>
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                <Fire weight="duotone" className="text-3xl mb-2 text-orange-400" />
                                <div className="text-2xl font-bold">—</div>
                                <div className="text-xs text-slate-400">Chuỗi (Streak)</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contests + Top Coders Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Contests — DỮ LIỆU THỰC TỪ API */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex justify-between items-end">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <CalendarStar weight="duotone" className="text-blue-500" /> Cuộc Thi Sắp Tới
                            </h2>
                            <Link to="/contests" className="text-blue-400 text-sm hover:underline">Xem tất cả</Link>
                        </div>

                        {loadingContests ? (
                            <div className="flex items-center justify-center py-12 text-slate-400">
                                <CircleNotch weight="bold" className="text-2xl animate-spin mr-3" />
                                Đang tải cuộc thi...
                            </div>
                        ) : displayContests.length === 0 ? (
                            <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl p-8 text-center border border-slate-700/50">
                                <Calendar weight="duotone" className="text-4xl text-slate-500 mx-auto mb-3" />
                                <p className="text-slate-400">Hiện chưa có cuộc thi nào.</p>
                            </div>
                        ) : (
                            displayContests.map((contest) => {
                                const cfg = statusConfig[contest.status] || statusConfig.upcoming;
                                const isActive = contest.status === 'active';
                                return (
                                    <div
                                        key={contest.id}
                                        className={`bg-slate-800/40 backdrop-blur-lg rounded-2xl p-6 hover:-translate-y-1 transition-all duration-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden border ${isActive ? 'border-blue-500/20 hover:shadow-[0_10px_25px_-5px_rgba(59,130,246,0.3)]' : 'border-slate-700/50 hover:shadow-[0_10px_25px_-5px_rgba(168,85,247,0.15)]'}`}
                                    >
                                        {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />}
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                                                    {cfg.label}
                                                </span>
                                                <span className="text-sm text-slate-400 flex items-center gap-1">
                                                    {isActive ? (
                                                        <><Clock className="text-sm" /> Còn {getTimeLeft(contest.endTime, contest.serverTime)}</>
                                                    ) : (
                                                        <><Calendar className="text-sm" /> Bắt đầu sau {getTimeLeft(contest.startTime, contest.serverTime)}</>
                                                    )}
                                                </span>
                                            </div>
                                            <Link to={`/contests/${contest.id}`}>
                                                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors line-clamp-1">{contest.title}</h3>
                                            </Link>
                                            <p className="text-slate-400 text-sm">
                                                {contest.participantCount} người tham gia
                                            </p>
                                        </div>
                                        <div className="shrink-0 mt-2 sm:mt-0">
                                            {renderActionButton(contest)}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Top Coders — chưa có API, placeholder */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Trophy weight="duotone" className="text-orange-500" /> Top Coders
                        </h2>
                        <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl p-6 border border-slate-700/50 text-center">
                            <Fire weight="duotone" className="text-5xl text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400 text-sm mb-1">Bảng xếp hạng sẽ sớm ra mắt</p>
                            <p className="text-slate-500 text-xs">Hãy bắt đầu giải bài để ghi tên trên bảng!</p>
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
