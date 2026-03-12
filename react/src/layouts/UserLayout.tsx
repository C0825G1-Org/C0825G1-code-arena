import React, { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { RootState } from '../app/store';
import { logout } from '../features/auth/store/authSlice';
import { userDashboardService, UserStats } from '../features/user/home/services/userDashboardService';
import { NotificationBell } from '../shared/components/NotificationBell';
import {
    Code,
    SignOut,
    ShieldStar,
    FacebookLogo,
    TwitterLogo,
    GithubLogo,
    Crown
} from '@phosphor-icons/react';
import { Avatar } from '../shared/components/Avatar';
import axiosClient from '../shared/services/axiosClient';

interface UserLayoutProps {
    children: React.ReactNode;
    hideChrome?: boolean;
}

export const UserLayout: React.FC<UserLayoutProps> = ({ children, hideChrome = false }) => {
    const { user } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const [userStats, setUserStats] = useState<UserStats | null>(null);
    const [currentPlan, setCurrentPlan] = useState<{ name: string } | null>(null);
    const userRole = user?.role?.replace('ROLE_', '').toUpperCase() || '';
    const isModerator = userRole === 'MODERATOR' || userRole === 'ADMIN';

    const fetchDashboardData = useCallback(async () => {
        if (!user) return;
        try {
            const statsData = await userDashboardService.getUserStats();
            setUserStats(statsData);
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
        }
    }, [user]);

    const fetchCurrentPlan = useCallback(async () => {
        if (!user) return;
        try {
            const plan: any = await axiosClient.get('/subscriptions/my-plan');
            setCurrentPlan(plan);
        } catch (err) {
            // Silently fail - fallback to no badge
        }
    }, [user]);

    useEffect(() => {
        fetchDashboardData();
        fetchCurrentPlan();
    }, [fetchDashboardData, fetchCurrentPlan]);

    const handleLogout = () => {
        navigate('/');
        setTimeout(() => {
            dispatch(logout());
        }, 10);
    };

    const navLinks = [
        { path: '/home', label: 'Trang chủ' },
        { path: '/problems', label: 'Bài tập' },
        { path: '/contests', label: 'Cuộc thi' },
        { path: '/leaderboard', label: 'Bảng xếp hạng' },
        { path: '/pricing', label: 'Nâng cấp', icon: <Crown size={20} className="text-purple-400" />, className: "flex items-center gap-1.5 font-medium bg-gradient-to-r from-blue-500/10 to-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20", textClassName: "text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400" },
    ];

    const isPathActive = (path: string) => {
        if (path === '/problems' && location.pathname.startsWith('/problems')) return true;
        if (path === '/contests' && location.pathname.startsWith('/contests')) return true;
        return location.pathname === path;
    };

    return (
        <div className="antialiased min-h-screen flex flex-col relative bg-[#0f172a] text-slate-50 font-sans overflow-clip">
            {/* Background Glows */}
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none z-0" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none z-0" />

            {/* Navbar */}
            <nav className={`sticky top-0 z-50 px-6 py-4 flex justify-between items-center border-b border-white/10 bg-slate-900/60 backdrop-blur-xl ${hideChrome ? 'hidden' : ''}`}>
                <div className="flex items-center gap-8">
                    <Link to="/home" className="flex items-center gap-2 text-2xl font-bold tracking-tighter shrink-0">
                        <Code weight="fill" className="text-blue-500 text-3xl" />
                        <span className="text-white">Code<span className="text-blue-500">Arena</span></span>
                    </Link>
                    <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => {
                                    if (link.path === '/pricing') {
                                        navigate('/pricing');
                                    }
                                }}
                                className={`transition-colors ${isPathActive(link.path) ? 'text-white font-bold' : 'hover:text-blue-400'} ${link.className || ''}`}
                            >
                                {link.icon && <span className="flex items-center">{link.icon}</span>}
                                <span className={link.textClassName || ''}>{link.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {!user ? (
                        <div className="flex items-center gap-4">
                            <Link to="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">Đăng nhập</Link>
                            <Link to="/register" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/30 transition-all text-sm font-bold border border-blue-500">
                                Đăng ký
                            </Link>
                        </div>
                    ) : (
                        <>
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
                                    <div className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors truncate max-w-[120px]">
                                        {user?.fullName || 'User'}
                                    </div>
                                    <div className="flex items-center justify-end gap-1.5">
                                        <span className="text-xs text-slate-400 font-mono">
                                            Rating: <span className="text-yellow-400">{userStats?.eloRanking ?? 0}</span>
                                        </span>
                                        {currentPlan && (
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                                currentPlan.name === 'PRO'
                                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                                                    : 'bg-slate-700 text-slate-400'
                                            }`}>
                                                {currentPlan.name === 'PRO' ? '👑 PRO' : 'FREE'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <Avatar
                                    src={user?.avatarUrl}
                                    userId={user?.id}
                                    size="md"
                                />
                            </Link>

                            <button
                                onClick={handleLogout}
                                title="Đăng xuất"
                                className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors border border-red-500/20 bg-red-500/5 hover:border-red-500/50"
                            >
                                <SignOut weight="bold" className="text-xl" />
                            </button>
                        </>
                    )}
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 w-full flex flex-col">
                {children}
            </main>

            {/* Footer */}
            <footer className={`bg-slate-900/60 backdrop-blur-xl border-t border-slate-800 py-8 px-6 z-10 relative ${hideChrome ? 'hidden' : ''}`}>
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
