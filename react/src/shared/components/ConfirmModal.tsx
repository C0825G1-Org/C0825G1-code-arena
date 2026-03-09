import React from 'react';
import { X, WarningCircle, Info, Trash, LockKey, LockKeyOpen } from '@phosphor-icons/react';

export type ConfirmModalType = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    type?: ConfirmModalType;
    isLoading?: boolean;
    icon?: 'trash' | 'lock' | 'unlock' | 'info' | 'warning';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Xác nhận',
    cancelText = 'Hủy',
    type = 'warning',
    isLoading = false,
    icon = 'warning'
}) => {
    if (!isOpen) return null;

    const getTypeClasses = () => {
        switch (type) {
            case 'danger': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'warning': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'success': return 'bg-green-500/10 text-green-500 border-green-500/20';
            default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        }
    };

    const getConfirmBtnClasses = () => {
        switch (type) {
            case 'danger': return 'bg-red-600 hover:bg-red-500 shadow-red-500/20';
            case 'warning': return 'bg-yellow-600 hover:bg-yellow-500 shadow-yellow-500/20';
            case 'success': return 'bg-green-600 hover:bg-green-500 shadow-green-500/20';
            default: return 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20';
        }
    };

    const renderIcon = () => {
        const size = 28;
        const weight = "fill";
        switch (icon) {
            case 'trash': return <Trash size={size} weight={weight} />;
            case 'lock': return <LockKey size={size} weight={weight} />;
            case 'unlock': return <LockKeyOpen size={size} weight={weight} />;
            case 'info': return <Info size={size} weight={weight} />;
            default: return <WarningCircle size={size} weight={weight} />;
        }
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-[#1e293b] border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-md p-6 overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 border ${getTypeClasses()}`}>
                        {renderIcon()}
                    </div>
                    <div className="flex-1 pt-1">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-bold text-white">{title}</h3>
                            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                                <X size={20} weight="bold" />
                            </button>
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed">
                            {description}
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 font-medium">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-5 py-2.5 text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all disabled:opacity-50 border border-slate-700"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`px-5 py-2.5 text-white rounded-xl transition-all shadow-lg disabled:opacity-50 flex items-center gap-2 ${getConfirmBtnClasses()}`}
                    >
                        {isLoading ? (
                            <>
                                <i className="ph-bold ph-spinner animate-spin"></i> Xử lý...
                            </>
                        ) : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
