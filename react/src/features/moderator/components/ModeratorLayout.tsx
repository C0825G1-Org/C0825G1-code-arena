import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../app/store';
import { logout } from '../../auth/store/authSlice';

interface ModeratorLayoutProps {
    children?: React.ReactNode;
    headerTitle?: React.ReactNode;
}

export const ModeratorLayout = ({ children, headerTitle }: ModeratorLayoutProps) => {
    const user = useSelector((state: RootState) => state.auth.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();

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
            <aside className="w-64 bg-[#0b1120] border-r border-[#1e293b] flex flex-col pt-6 pb-4 z-20 shrink-0 transition-transform duration-300">
                <div className="px-6 mb-8 mt-2 text-xl font-bold tracking-tight flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
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
                            `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                                isActive
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
                            `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                                isActive || window.location.pathname.includes('/moderator/problems')
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
                            `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                                isActive
                                    ? 'bg-blue-600 text-white shadow-[0_4px_14px_0_rgba(59,130,246,0.39)]'
                                    : 'text-[#94a3b8] hover:bg-blue-500/10 hover:text-blue-400'
                            }`
                        }
                    >
                        <i className="ph-duotone ph-flask text-xl"></i> Kho Test Cases
                    </NavLink>
                    <NavLink
                        to="/moderator/contests"
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                                isActive
                                    ? 'bg-blue-600 text-white shadow-[0_4px_14px_0_rgba(59,130,246,0.39)]'
                                    : 'text-[#94a3b8] hover:bg-blue-500/10 hover:text-blue-400'
                            }`
                        }
                    >
                        <i className="ph-duotone ph-trophy text-xl"></i> Quản lý Kỳ thi
                    </NavLink>
                    <NavLink
                        to="/moderator/submissions"
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                                isActive
                                    ? 'bg-blue-600 text-white shadow-[0_4px_14px_0_rgba(59,130,246,0.39)]'
                                    : 'text-[#94a3b8] hover:bg-blue-500/10 hover:text-blue-400'
                            }`
                        }
                    >
                        <i className="ph-duotone ph-list-dashes text-xl"></i> Lịch sử Chấm bài
                    </NavLink>
                    <NavLink
                        to="/moderator/candidates"
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                                isActive
                                    ? 'bg-blue-600 text-white shadow-[0_4px_14px_0_rgba(59,130,246,0.39)]'
                                    : 'text-[#94a3b8] hover:bg-blue-500/10 hover:text-blue-400'
                            }`
                        }
                    >
                        <i className="ph-duotone ph-users-three text-xl"></i> Danh sách thí sinh
                    </NavLink>
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* HeaderBar */}
                <header className="h-16 border-b border-[#1e293b] bg-slate-900/50 backdrop-blur flex justify-between items-center px-8 z-10 sticky top-0 shrink-0">
                    {/* Header title can be injected via context or left generic if page titles are rendered in the content area. We will keep it generic or empty here, as each page might want its own header tools (like CreatePage has a Back button and Save button).
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
                        <div className="flex items-center gap-3 text-sm">
                            <span className="font-semibold text-white">{user?.username || 'Moderator'}</span>
                            <img
                                src="https://ui-avatars.com/api/?name=Mod&background=indigo&color=fff"
                                className="w-9 h-9 rounded-full border border-indigo-500"
                                alt="Avatar"
                            />
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors ml-2 border border-red-500/20 bg-red-500/5 flex items-center justify-center h-9 w-9"
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
