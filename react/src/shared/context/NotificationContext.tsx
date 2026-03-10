import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useContestWebSocket } from '../../features/user/contests/hooks/useContestWebSocket';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AppNotification {
    id: number;
    message: string;
    contestId: number;
    time: Date;
    read: boolean;
}

interface NotificationContextValue {
    notifications: AppNotification[];
    unreadCount: number;
    markAllRead: () => void;
    markRead: (id: number) => void;
    clearAll: () => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const NotificationContext = createContext<NotificationContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);

    // Khôi phục notifications từ localStorage khi app load
    const [notifications, setNotifications] = useState<AppNotification[]>(() => {
        try {
            const saved = localStorage.getItem('contest_notifications');
            if (!saved) return [];
            return JSON.parse(saved).map((n: any) => ({ ...n, time: new Date(n.time) }));
        } catch {
            return [];
        }
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    // Tự động lưu vào localStorage mỗi khi notifications thay đổi
    useEffect(() => {
        localStorage.setItem('contest_notifications', JSON.stringify(notifications));
    }, [notifications]);

    // ── Handlers ─────────────────────────────────────────────────────────────

    const handleContestStatusUpdate = useCallback((_contestId: number, _status: string) => {
        // Không cần xử lý gì ở đây — các trang tự refetch qua hook riêng của họ
    }, []);

    const handleContestReminder = useCallback((data: {
        contestId: number;
        contestTitle: string;
        minutesLeft: number;
    }) => {
        const message = data.minutesLeft >= 60
            ? `Cuộc thi "${data.contestTitle}" sẽ bắt đầu sau ${Math.floor(data.minutesLeft / 60)} giờ nữa!`
            : `Cuộc thi "${data.contestTitle}" sẽ bắt đầu sau ${data.minutesLeft} phút nữa!`;

        // Thêm vào danh sách (tối đa 20 thông báo)
        setNotifications(prev => {
            const updated = [{
                id: Date.now(),
                message,
                contestId: data.contestId,
                time: new Date(),
                read: false,
            }, ...prev];
            return updated.slice(0, 20);
        });

        // Hiện toast với nút tắt
        toast.custom((t) => (
            <div
                className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl border transition-all
                    ${data.minutesLeft <= 5
                        ? 'bg-purple-900 border-purple-500 text-white'
                        : 'bg-slate-800 border-slate-600 text-white'}
                    ${t.visible ? 'animate-enter' : 'animate-leave'}`}
                style={{ minWidth: 280, maxWidth: 360 }}
            >
                <span className="text-xl mt-0.5">{data.minutesLeft <= 5 ? '🚨' : '⏰'}</span>
                <p className="flex-1 text-sm font-medium">{message}</p>
                <button
                    onClick={() => toast.dismiss(t.id)}
                    className="text-slate-400 hover:text-white transition-colors ml-1 mt-0.5 shrink-0 text-lg leading-none"
                >
                    ✕
                </button>
            </div>
        ), { duration: 8000 });
    }, []);

    // Chỉ kết nối socket khi đã đăng nhập
    useContestWebSocket(
        isAuthenticated ? handleContestStatusUpdate : () => {},
        isAuthenticated ? handleContestReminder : undefined
    );

    // ── Actions ──────────────────────────────────────────────────────────────

    const markAllRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const markRead = useCallback((id: number) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead, markRead, clearAll }}>
            {children}
        </NotificationContext.Provider>
    );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useNotifications = () => {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
    return ctx;
};
