import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../app/store';
import { logout } from '../../auth/store/authSlice';
import {
    HardDrives, SquaresFour, Users, Tag, SignOut, FileText, Trophy
} from '@phosphor-icons/react';

// ─── Sidebar Nav Item ─────────────────────────────────────────────────────────
const SidebarLink = ({
    href, icon: Icon, label, active,
}: {
    href: string; icon: React.ElementType; label: string; active?: boolean;
}) => (
    <Link
        to={href}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all
            ${active
                ? 'bg-red-500 text-white shadow-[0_4px_14px_0_rgba(239,68,68,0.3)]'
                : 'text-slate-400 hover:bg-red-500/10 hover:text-red-400'}`}
    >
        <Icon weight={active ? "bold" : "duotone"} className="text-xl shrink-0" />
        {label}
    </Link>
);

export interface AdminLayoutProps {
    title: string;
    activeTab: 'dashboard' | 'users' | 'tags' | 'problems' | 'contests';
    children: React.ReactNode;
    contentClassName?: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ 
    title, 
    activeTab, 
    children, 
    contentClassName = "flex-1 overflow-y-auto p-8" 
}) => {
    const { user } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogout = () => {
        navigate('/');
        setTimeout(() => dispatch(logout()), 10);
    };

    return (
        <div className="antialiased h-screen flex overflow-hidden bg-slate-900 text-slate-50 font-sans selection:bg-red-500/30">
            {/* ── Sidebar ────────────────────────────────────────────────── */}
            <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col pt-6 pb-4 shrink-0 z-20 transition-transform duration-300">
                {/* Logo */}
                <div className="px-6 mb-8 mt-2 text-xl font-bold tracking-tight text-white flex gap-2 items-center">
                    <div className="w-8 h-8 rounded bg-red-600 flex items-center justify-center shadow-lg shadow-red-500/20">
                        <HardDrives weight="bold" className="text-lg text-white" />
                    </div>
                    CodeArena<span className="text-red-500 text-sm align-top ml-1 font-mono">ADMIN</span>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-4 space-y-2">
                    <SidebarLink href="/admin/dashboard" icon={SquaresFour} label="System Dashboard" active={activeTab === 'dashboard'} />
                    <SidebarLink href="/admin/users"     icon={Users}       label="Quản lý Users" active={activeTab === 'users'} />
                    <SidebarLink href="/admin/tags"      icon={Tag}         label="Phân loại (Tags)" active={activeTab === 'tags'} />
                    <SidebarLink href="/admin/problems"  icon={FileText}    label="Quản lý bài tập" active={activeTab === 'problems'} />
                    <SidebarLink href="/admin/contests"  icon={Trophy}      label="Quản lý cuộc thi" active={activeTab === 'contests'} />
                </nav>

                {/* Logout */}
                <div className="px-4 mt-4 border-t border-slate-800 pt-4">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-red-500 hover:bg-red-500/10 hover:text-red-400 transition-colors font-medium border border-transparent hover:border-red-500/50"
                        title="Đăng xuất"
                    >
                        <SignOut weight="bold" className="text-xl" />
                        Đăng xuất
                    </button>
                </div>
            </aside>

            {/* ── Main ───────────────────────────────────────────────────── */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-900">
                {/* Header */}
                <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex justify-between items-center px-8 z-10 sticky top-0 shrink-0">
                    <h1 className="text-xl font-semibold text-white">{title}</h1>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20 hidden sm:flex">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-red-400 text-xs font-bold uppercase tracking-wider">Root Access</span>
                        </div>
                        <div className="h-6 w-px bg-slate-700 hidden sm:block" />
                        {/* Profile */}
                        <div className="relative flex items-center gap-3 cursor-pointer hover:bg-slate-800 p-2 rounded-lg transition">
                            <div className="text-right hidden sm:block">
                                <div className="text-sm font-semibold text-white leading-tight">{user?.fullName || 'System Admin'}</div>
                                <div className="text-xs text-slate-400 font-mono">ID: {user?.id || 1}</div>
                            </div>
                            <img
                                src={`https://i.pravatar.cc/150?u=${user?.id || 1}`}
                                alt="Admin Avatar"
                                className="w-10 h-10 rounded-full border border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                            />
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className={contentClassName}>
                    {children}
                </div>
            </main>
        </div>
    );
};
