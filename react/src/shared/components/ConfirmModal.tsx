import React from 'react';
import { X, WarningCircle, Trash, Info } from '@phosphor-icons/react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
    type?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Xác nhận',
    cancelText = 'Hủy',
    isLoading = false,
    type = 'danger'
}) => {
    if (!isOpen) return null;

    const iconMap = {
        danger: <Trash size={32} className="text-red-400" />,
        warning: <WarningCircle size={32} className="text-yellow-400" />,
        info: <Info size={32} className="text-blue-400" />
    };

    const colorMap = {
        danger: 'bg-red-500 hover:bg-red-600 shadow-red-500/20',
        warning: 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-500/20',
        info: 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20'
    };

    const bgMap = {
        danger: 'bg-red-500/10 border-red-500/20',
        warning: 'bg-yellow-500/10 border-yellow-500/20',
        info: 'bg-blue-500/10 border-blue-500/20'
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
                className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header-ish */}
                <div className={`p-6 pb-2 flex justify-center`}>
                    <div className={`p-4 rounded-2xl border ${bgMap[type]}`}>
                        {iconMap[type]}
                    </div>
                </div>

                {/* Content */}
                <div className="px-8 pt-4 pb-8 text-center space-y-2">
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 px-6 py-4 bg-slate-950/50 border-t border-slate-800">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`flex-1 px-4 py-2.5 text-sm font-bold text-white rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 ${colorMap[type]}`}
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                <span>Đang xử lý...</span>
                            </div>
                        ) : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
