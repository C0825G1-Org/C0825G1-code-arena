import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../app/store';
import { logout } from '../../auth/store/authSlice';
import {
    Code,
    SquaresFour,
    CalendarStar,
    BookOpenText,
    SignOut,
    House
} from '@phosphor-icons/react';

export const ModeratorSidebar = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogout = () => {
        navigate('/');
        setTimeout(() => {
            dispatch(logout());
        }, 10);
    };

    return (
        <aside className="w-64 border-r border-white/10 bg-slate-900/60 backdrop-blur-xl flex flex-col z-20 h-full">
            <div className="p-6 border-b border-white/10 flex items-center gap-2">
                <Code weight="fill" className="text-purple-500 text-3xl" />
                <span className="text-xl font-bold text-white tracking-tighter">
                    Code<span className="text-purple-500">Mod</span>
                </span>
            </div>

            <div className="p-6 flex items-center gap-3 border-b border-white/10">
                <img
                    src={`https://i.pravatar.cc/150?u=${user?.id || 1}`}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full border-2 border-purple-500/50 object-cover"
                />
                <div className="overflow-hidden">
                    <p className="text-sm font-semibold text-white truncate">{user?.fullName || 'Moderator'}</p>
                    <p className="text-xs text-purple-400 font-mono truncate">@{user?.username}</p>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                <NavLink
                    to="/moderator/dashboard"
                    end
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${isActive
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                            : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                        }`
                    }
                >
                    <SquaresFour weight="duotone" className="text-xl" /> Tổng quan
                </NavLink>

                <NavLink
                    to="/moderator/contests"
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${isActive
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                            : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                        }`
                    }
                >
                    <CalendarStar weight="duotone" className="text-xl" /> Cuộc thi
                </NavLink>

                <NavLink
                    to="/moderator/problems"
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm border border-transparent ${isActive
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                            : 'text-slate-500 cursor-not-allowed border-dashed border-slate-700/50'
                        }`
                    }
                    onClick={(e) => e.preventDefault()} // Disabled for now
                >
                    <BookOpenText weight="duotone" className="text-xl" /> Bài tập (Sắp ra mắt)
                </NavLink>
            </nav>

            <div className="p-4 border-t border-white/10 space-y-2">
                <NavLink
                    to="/home"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-slate-400 hover:bg-slate-800/80 hover:text-blue-400"
                >
                    <House weight="duotone" className="text-xl" /> Về User Home
                </NavLink>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                    <SignOut weight="bold" className="text-xl" /> Đăng xuất
                </button>
            </div>
        </aside>
    );
};
