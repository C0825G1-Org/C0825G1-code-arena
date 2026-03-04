import React, { useEffect, useState } from 'react';
import { LockKey, SignOut } from '@phosphor-icons/react';

export const GlobalLockOverlay: React.FC = () => {
    const [isLocked, setIsLocked] = useState(false);

    useEffect(() => {
        const handleLockEvent = () => {
            setIsLocked(true);
        };

        window.addEventListener('auth:locked', handleLockEvent);

        return () => {
            window.removeEventListener('auth:locked', handleLockEvent);
        };
    }, []);

    const handleLogout = () => {
        // Clear auth data and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    if (!isLocked) return null;

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative bg-slate-900 border border-slate-700/60 rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 text-center overflow-hidden">
                {/* Decorative background circle */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-500/10 rounded-full blur-3xl" />
                
                <div className="relative">
                    <div className="w-20 h-20 mx-auto bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-red-500/20">
                        <LockKey weight="duotone" className="text-red-500 text-4xl" />
                    </div>
                    
                    <h2 className="text-2xl font-bold text-white mb-2">Tài khoản bị khoá</h2>
                    <p className="text-slate-400 text-sm leading-relaxed mb-8 px-2">
                        Tài khoản của bạn đã bị vô hiệu hoá bởi quản trị viên. Bạn không thể tiếp tục truy cập vào hệ thống.
                    </p>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium border border-slate-700 transition"
                    >
                        <SignOut weight="bold" className="text-lg" />
                        Đăng xuất / Quay lại đăng nhập
                    </button>
                </div>
            </div>
        </div>
    );
};
