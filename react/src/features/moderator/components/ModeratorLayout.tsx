import React, { useEffect, useState, useCallback } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../app/store';
import { logout } from '../../auth/store/authSlice';
import { userDashboardService, UserStats } from "../../user/home/services/userDashboardService";
import { Bell, ShieldStar, Crown, ShoppingCart, House } from "@phosphor-icons/react";
import { Avatar } from '../../../shared/components/Avatar';
import axiosClient from '../../../shared/services/axiosClient';
import UserNameWithRank from '../../../shared/components/UserNameWithRank';

interface ModeratorLayoutProps {
    children?: React.ReactNode;
    headerTitle?: React.ReactNode;
}

export const ModeratorLayout = ({ children, headerTitle }: ModeratorLayoutProps) => {
    const user = useSelector((state: RootState) => state.auth.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [userStats, setUserStats] = useState<UserStats | null>(null);
    const [currentPlan, setCurrentPlan] = useState<{ name: string } | null>(null);

    const fetchUserStats = useCallback(async () => {
        if (user) {
            try {
                const stats = await userDashboardService.getUserStats();
                setUserStats(stats);
            } catch (error) {
                console.error('Failed to fetch user stats', error);
            }
        }
    }, [user]);

    const fetchCurrentPlan = useCallback(async () => {
        if (!user) return;
        try {
            const plan: any = await axiosClient.get('/subscriptions/my-plan');
            setCurrentPlan(plan);
        } catch (err) {
            // Silently fail
        }
    }, [user]);

    useEffect(() => {
        fetchUserStats();
        fetchCurrentPlan();
    }, [fetchUserStats, fetchCurrentPlan]);

    const handleLogout = (e: React.MouseEvent) => {
        e.preventDefault();
        navigate('/');
        setTimeout(() => {
            dispatch(logout());
        }, 10);
    };

    return (
        <div className="antialiased min-h-screen flex overflow-hidden bg-[#0f172a] text-[#f8fafc] font-sans">
            {/* Sidebar Moderator */}
            <aside
                className="w-64 bg-[#0b1120] border-r border-[#1e293b] flex flex-col pt-6 pb-4 z-20 shrink-0 transition-transform duration-300">
                <div className="px-6 mb-8 mt-2 text-xl font-bold tracking-tight flex items-center gap-2">
                    <div
                        className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                        <i className="ph-bold ph-shield text-white text-lg"></i>
                    </div>
                    <span className="text-white">
                        Moderator<span className="text-indigo-400">Panel</span>
                    </span>
                </div>

                <nav className="flex-1 px-4 space-y-2">

                    <NavLink
                        to="/moderator/dashboard"
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isActive
                                ? 'bg-blue-600 text-white shadow-[0_4px_14px_0_rgba(59,130,246,0.39)]'
                                : 'text-[#94a3b8] hover:bg-blue-500/10 hover:text-blue-400'
                            }`
                        }
                    >
                        <i className="ph-duotone ph-squares-four text-xl"></i> Tổng quan
                    </NavLink>
                    <NavLink
                        to="/moderator/problems"
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isActive || window.location.pathname.includes('/moderator/problems')
                                ? 'bg-blue-600 text-white shadow-[0_4px_14px_0_rgba(59,130,246,0.39)]'
                                : 'text-[#94a3b8] hover:bg-blue-500/10 hover:text-blue-400'
                            }`
                        }
                    >
                        <i className="ph-duotone ph-book-open-text text-xl"></i> Ngân hàng bài tập
                    </NavLink>
                    <NavLink
                        to="/moderator/testcases"
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isActive
                                ? 'bg-blue-600 text-white shadow-[0_4px_14px_0_rgba(59,130,246,0.39)]'
                                : 'text-[#94a3b8] hover:bg-blue-500/10 hover:text-blue-400'
                            }`
                        }
                    >
                        <i className="ph-duotone ph-flask text-xl"></i> Kho test cases
                    </NavLink>
                    <NavLink
                        to="/moderator/contests"
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isActive
                                ? 'bg-blue-600 text-white shadow-[0_4px_14px_0_rgba(59,130,246,0.39)]'
                                : 'text-[#94a3b8] hover:bg-blue-500/10 hover:text-blue-400'
                            }`
                        }
                    >
                        <i className="ph-duotone ph-trophy text-xl"></i> Quản lý kỳ thi
                    </NavLink>
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* HeaderBar */}
                <header
                    className="top-0 z-50 px-6 py-4 flex justify-between items-center border-b border-white/10 bg-slate-900/60 backdrop-blur-xl">
                    <div className="flex-1">
                        {headerTitle ? (
                            typeof headerTitle === 'string' ? (
                                <h1 className="text-xl font-semibold text-white">{headerTitle}</h1>
                            ) : (
                                headerTitle
                            )
                        ) : null}
                    </div>
                    <div className="flex items-center gap-4">
                        <Link
                            to='/home'
                            title="HomePage"
                            className="hidden sm:flex items-center gap-2 p-2 rounded-xl bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 hover:text-blue-300 transition-all border border-blue-500/20"
                        >
                            <House weight="fill" className="text-xl" />
                        </Link>

                        <Link
                            to="/pricing"
                            title="Nâng cấp"
                            className="hidden sm:flex items-center justify-center p-2 text-purple-400 hover:bg-purple-500/10 rounded-xl transition-colors border border-purple-500/20 bg-purple-500/5 hover:border-purple-500/50"
                        >
                            <Crown weight="bold" className="text-xl" />
                        </Link>

                        <Link
                            to="/shop"
                            title="Cửa hàng"
                            className="hidden sm:flex items-center justify-center p-2 text-yellow-400 hover:bg-yellow-500/10 rounded-xl transition-colors border border-yellow-500/20 bg-yellow-500/5 hover:border-yellow-500/50"
                        >
                            <ShoppingCart weight="bold" className="text-xl" />
                        </Link>

                        <Link
                            to="/profile"
                            className="flex items-center gap-3 cursor-pointer group pl-3 border-l border-slate-700 hover:bg-slate-800/50 p-2 rounded-xl transition-colors"
                        >
                            <div className="flex flex-col items-end">
                                <UserNameWithRank 
                                    username={user?.fullName || 'User'} 
                                    globalRating={userStats?.totalRating || 0} 
                                    type="total"
                                    className="text-sm font-semibold group-hover:text-blue-400 transition-colors truncate max-w-[120px]"
                                />
                                <div className="flex items-center justify-end gap-1.5">
                                    <span className="text-xs text-slate-400 font-mono">
                                        Rating Tổng: <span className="text-yellow-400">{userStats?.totalRating ?? 0}</span>
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
                                frameUrl={user?.avatarFrame}
                                userId={user?.id}
                                size="md"
                            />
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors border border-red-500/20 bg-red-500/5 hover:border-red-500/50"
                            title="Đăng xuất"
                        >
                            <i className="ph-bold ph-sign-out text-lg"></i>
                        </button>
                    </div>
                </header>

                {/* Page Content injected via Outlet or children props */}
                <div className="flex-1 overflow-y-auto bg-[#0f172a] relative flex flex-col min-h-0">
                    {children || <Outlet />}
                </div>
            </main>
        </div>
    );
};
