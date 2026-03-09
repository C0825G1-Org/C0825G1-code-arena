import React, { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { RootState } from '../app/store';
import { logout, updateLockStatus } from '../features/auth/store/authSlice';
import { userDashboardService, UserStats } from '../features/user/home/services/userDashboardService';
import { NotificationBell } from '../shared/components/NotificationBell';
import { useSocket } from '../shared/hooks/useSocket';
import { toast } from 'react-hot-toast';
import {
    Code,
    SignOut,
    ShieldStar,
    FacebookLogo,
    TwitterLogo,
    GithubLogo
} from '@phosphor-icons/react';

interface UserLayoutProps {
    children: React.ReactNode;
}

export const UserLayout: React.FC<UserLayoutProps> = ({ children }) => {
    const { user } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const userRole = user?.role?.replace('ROLE_', '').toUpperCase() || '';
    const isModerator = userRole === 'MODERATOR' || userRole === 'ADMIN';

    const [userStats, setUserStats] = useState<UserStats | null>(null);

    const fetchDashboardData = useCallback(async () => {
        if (!user) return;
        try {
            const statsData = await userDashboardService.getUserStats();
            setUserStats(statsData);
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
        }
    }, [user]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const handleLogout = () => {
        navigate('/');
        setTimeout(() => {
            dispatch(logout());
        }, 10);
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
                        <Link to="/home" className="hover:text-blue-400 transition-colors">Trang chủ</Link>
                        <Link to="/problems" className="hover:text-blue-400 transition-colors">Bài tập</Link>
                        <Link to="/contests" className="hover:text-blue-400 transition-colors">Cuộc thi</Link>
                        <Link to="/leaderboard" className="hover:text-blue-400 transition-colors">Bảng xếp hạng</Link>
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

                    <NotificationBell />

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
                                className="text-yellow-400">{userStats?.eloRanking ?? 0}</span>
                            </div>
                        </div>
                        <img
                            src={user?.avatarUrl || `https://i.pravatar.cc/150?u=${user?.id || 1}`}
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
            <div className="flex-1 flex flex-col z-10 w-full">
                {children}
            </div>

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
