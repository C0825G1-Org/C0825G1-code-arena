import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from '@phosphor-icons/react';
import { useNotifications } from '../context/NotificationContext';

/**
 * Reusable notification bell icon with dropdown.
 * Drop-in replacement for the static <Bell /> button in any navbar.
 */
export const NotificationBell = () => {
    const navigate = useNavigate();
    const { notifications, unreadCount, markAllRead, markRead } = useNotifications();
    const [open, setOpen] = useState(false);

    return (
        <div className="relative">
            {/* Bell Button */}
            <button
                onClick={() => setOpen(v => !v)}
                className="relative p-2 rounded-full hover:bg-slate-800 transition-colors text-slate-300"
                title="Thông báo"
            >
                <Bell className="text-xl" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 top-12 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                        <span className="font-bold text-white">Thông báo</span>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                Đánh dấu tất cả đã đọc
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="max-h-72 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="py-8 text-center text-slate-500 text-sm">
                                Không có thông báo nào
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <div
                                    key={notif.id}
                                    onClick={() => {
                                        markRead(notif.id);
                                        navigate(`/contests/${notif.contestId}`);
                                        setOpen(false);
                                    }}
                                    className={`px-4 py-3 border-b border-slate-800 cursor-pointer hover:bg-slate-800 transition-colors
                                        ${!notif.read ? 'bg-purple-500/10' : ''}`}
                                >
                                    <p className={`text-sm ${!notif.read ? 'text-white font-medium' : 'text-slate-400'}`}>
                                        {notif.message}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {notif.time.toLocaleTimeString('vi-VN')}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
