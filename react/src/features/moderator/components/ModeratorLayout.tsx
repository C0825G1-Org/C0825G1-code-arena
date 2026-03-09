import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../app/store';
import { logout } from '../../auth/store/authSlice';
import { userDashboardService, UserStats } from "../../user/home/services/userDashboardService";
import { Bell, ShieldStar } from "@phosphor-icons/react";
import { Avatar } from '../../../shared/components/Avatar';

interface ModeratorLayoutProps {
    children?: React.ReactNode;
    headerTitle?: React.ReactNode;
}

export const ModeratorLayout = ({ children, headerTitle }: ModeratorLayoutProps) => {
    const user = useSelector((state: RootState) => state.auth.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [userStats, setUserStats] = useState<UserStats | null>(null);
    useEffect(() => {
        const fetchUserStats = async () => {
            if (user) {
                try {
                    const stats = await userDashboardService.getUserStats();
                    setUserStats(stats);
                } catch (error) {
                    console.error('Failed to fetch user stats', error);
                }
            }
        };
        fetchUserStats();
    }, [user]);

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
                    {/* Header title can be injected via context or left generic if pages titles are rendered in the content area. We will keep it generic or empty here, as each pages might want its own header tools (like CreatePage has a Back button and Save button).
                        Actually, let's put the user profile and logout here. */}
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
                            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600/20 text-blue-300 hover:bg-blue-600/40 hover:text-blue-100 transition-all text-sm font-medium border border-blue-500/20"
                        >
                            <ShieldStar weight="duotone" className="text-lg" />
                            <span>HomePage</span>
                        </Link>
                        <Link
                            to="/profile"
                            className="flex items-center gap-3 cursor-pointer group pl-3 border-l border-slate-700 hover:bg-slate-800/50 p-2 rounded-xl transition-colors"
                        >
                            <Avatar
                                src={user?.avatarUrl}
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
