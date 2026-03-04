import React from 'react';
import { UserSwitch, Warning, X, SpinnerGap } from '@phosphor-icons/react';
import { AdminUserDTO } from '../services/adminUserApi';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TargetRole = 'moderator' | 'user';

const ROLE_STYLE = {
    admin:     { badge: 'bg-red-500/10 text-red-400 border border-red-500/20',          label: 'ADMIN' },
    moderator: { badge: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20', label: 'MODERATOR' },
    user:      { badge: 'bg-slate-700 text-slate-300 border border-slate-600',          label: 'USER' },
} as const;

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ConfirmRoleModalProps {
    target: AdminUserDTO;
    pendingRole: TargetRole;
    onChangePending: (r: TargetRole) => void;
    onConfirm: () => void;
    onCancel: () => void;
    loading: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ConfirmRoleModal: React.FC<ConfirmRoleModalProps> = ({
    target, pendingRole, onChangePending, onConfirm, onCancel, loading,
}) => {
    const SELECTABLE_STYLE: Record<TargetRole, string> = {
        moderator: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 ring-2 ring-indigo-500/40',
        user:      'bg-slate-700 text-slate-300 border border-slate-600 ring-2 ring-slate-500/40',
    };
    const INACTIVE_STYLE = 'bg-slate-800 text-slate-500 border border-slate-700 hover:border-slate-500 hover:text-slate-300';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                            <UserSwitch weight="duotone" className="text-indigo-400 text-xl" />
                        </div>
                        <div>
                            <h3 className="text-white font-semibold text-base">Đổi quyền hạn</h3>
                            <p className="text-slate-500 text-xs">Chọn quyền mới cho tài khoản</p>
                        </div>
                    </div>
                    <button onClick={onCancel} className="text-slate-500 hover:text-slate-300 transition">
                        <X weight="bold" className="text-xl" />
                    </button>
                </div>

                {/* User info */}
                <div className="px-6 pt-5 pb-2">
                    <div className="flex items-center gap-3 bg-slate-800/60 border border-slate-700 rounded-xl p-3 mb-5">
                        <img
                            src={`https://i.pravatar.cc/150?u=${target.id}`}
                            alt={target.username}
                            className="w-10 h-10 rounded-full border border-slate-600 shrink-0"
                        />
                        <div className="min-w-0">
                            <p className="text-white font-semibold text-sm truncate">{target.fullName || target.username}</p>
                            <p className="text-slate-400 font-mono text-xs truncate">@{target.username}</p>
                        </div>
                        <span className={`ml-auto text-xs font-bold uppercase px-2.5 py-1 rounded shrink-0 ${ROLE_STYLE[target.role].badge}`}>
                            {ROLE_STYLE[target.role].label}
                        </span>
                    </div>

                    {/* Role selector */}
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Chọn quyền mới</p>
                    <div className="grid grid-cols-2 gap-3 mb-5">
                        {(['moderator', 'user'] as TargetRole[]).map(r => (
                            <button
                                key={r}
                                onClick={() => onChangePending(r)}
                                disabled={target.role === r}
                                className={`px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${
                                    pendingRole === r
                                        ? SELECTABLE_STYLE[r]
                                        : target.role === r
                                            ? 'bg-slate-800/40 text-slate-600 border border-slate-700 cursor-not-allowed opacity-50'
                                            : INACTIVE_STYLE
                                }`}
                            >
                                {r === 'moderator' ? 'MODERATOR' : 'USER'}
                            </button>
                        ))}
                    </div>

                    {/* Warning */}
                    <div className="flex gap-2 items-start bg-yellow-500/5 border border-yellow-500/20 rounded-xl px-4 py-3 mb-5">
                        <Warning weight="fill" className="text-yellow-400 text-lg shrink-0 mt-0.5" />
                        <p className="text-yellow-300/80 text-xs leading-relaxed">
                            Hành động này sẽ thay đổi quyền hạn của{' '}
                            <span className="font-bold text-yellow-300">@{target.username}</span>{' '}
                            thành <span className="font-bold uppercase">{pendingRole}</span>. Vui lòng xác nhận trước khi tiếp tục.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 px-6 pb-6">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium text-sm border border-slate-700 transition"
                    >
                        Huỷ
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading || pendingRole === target.role}
                        className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading && <SpinnerGap weight="bold" className="animate-spin text-base" />}
                        Xác nhận đổi quyền
                    </button>
                </div>

            </div>
        </div>
    );
};
