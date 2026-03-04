import React from 'react';
import { LockKey, LockKeyOpen, Warning, X, SpinnerGap } from '@phosphor-icons/react';
import { AdminUserDTO } from '../services/adminUserApi';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ConfirmLockModalProps {
    target: AdminUserDTO;
    onConfirm: () => void;
    onCancel: () => void;
    loading: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ConfirmLockModal: React.FC<ConfirmLockModalProps> = ({
    target, onConfirm, onCancel, loading,
}) => {
    const isLocking = !target.isLocked; // action we're about to take

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isLocking ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
                            {isLocking
                                ? <LockKey weight="duotone" className="text-red-400 text-xl" />
                                : <LockKeyOpen weight="duotone" className="text-emerald-400 text-xl" />
                            }
                        </div>
                        <div>
                            <h3 className="text-white font-semibold text-base">
                                {isLocking ? 'Khoá tài khoản' : 'Mở khoá tài khoản'}
                            </h3>
                            <p className="text-slate-500 text-xs">
                                {isLocking ? 'Tài khoản sẽ bị vô hiệu hoá' : 'Tài khoản sẽ được khôi phục'}
                            </p>
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
                        {target.isLocked && (
                            <span className="ml-auto text-xs font-bold uppercase px-2.5 py-1 rounded shrink-0 bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                LOCKED
                            </span>
                        )}
                    </div>

                    {/* Warning */}
                    <div className={`flex gap-2 items-start rounded-xl px-4 py-3 mb-5 border ${
                        isLocking
                            ? 'bg-red-500/5 border-red-500/20'
                            : 'bg-emerald-500/5 border-emerald-500/20'
                    }`}>
                        <Warning weight="fill" className={`text-lg shrink-0 mt-0.5 ${isLocking ? 'text-red-400' : 'text-emerald-400'}`} />
                        <p className={`text-xs leading-relaxed ${isLocking ? 'text-red-300/80' : 'text-emerald-300/80'}`}>
                            {isLocking ? (
                                <>
                                    Tài khoản <span className="font-bold">@{target.username}</span> sẽ bị <span className="font-bold">khoá</span> và không thể đăng nhập cho đến khi được mở khoá.
                                </>
                            ) : (
                                <>
                                    Tài khoản <span className="font-bold">@{target.username}</span> sẽ được <span className="font-bold">mở khoá</span> và có thể đăng nhập lại bình thường.
                                </>
                            )}
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
                        disabled={loading}
                        className={`flex-1 py-2.5 rounded-xl text-white font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                            isLocking
                                ? 'bg-red-600 hover:bg-red-500'
                                : 'bg-emerald-600 hover:bg-emerald-500'
                        }`}
                    >
                        {loading && <SpinnerGap weight="bold" className="animate-spin text-base" />}
                        {isLocking ? 'Xác nhận khoá' : 'Xác nhận mở khoá'}
                    </button>
                </div>

            </div>
        </div>
    );
};
