import React, { useState } from 'react';
import { X, Warning } from '@phosphor-icons/react';

interface ConfirmDeleteUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    requireConfirmationWord?: boolean;
    confirmationWord?: string;
    isSubmitting?: boolean;
}

export const ConfirmDeleteUserModal: React.FC<ConfirmDeleteUserModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    requireConfirmationWord = false,
    confirmationWord = 'XAC NHAN',
    isSubmitting = false,
}) => {
    const [inputValue, setInputValue] = useState('');

    if (!isOpen) return null;

    const isConfirmDisabled = isSubmitting || (requireConfirmationWord && inputValue !== confirmationWord);

    const handleConfirm = () => {
        if (!isConfirmDisabled) {
            onConfirm();
            setInputValue('');
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setInputValue('');
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
                onClick={handleClose}
            ></div>

            {/* Modal */}
            <div className="relative bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-800/50">
                    <div className="flex items-center gap-3 text-red-500">
                        <Warning weight="fill" className="text-2xl" />
                        <h3 className="text-lg font-bold">{title}</h3>
                    </div>
                    <button 
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="text-slate-400 hover:text-white transition bg-slate-800 hover:bg-slate-700 p-1.5 rounded-lg disabled:opacity-50"
                    >
                        <X weight="bold" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-slate-300 text-sm mb-4 leading-relaxed whitespace-pre-line">
                        {description}
                    </p>

                    {requireConfirmationWord && (
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Gõ chữ <span className="text-white font-mono bg-slate-800 px-1 py-0.5 rounded select-all">{confirmationWord}</span> để xác nhận:
                            </label>
                            <input
                                type="text"
                                className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-lg focus:ring-1 focus:ring-red-500 focus:border-red-500 block p-2.5 outline-none transition-all placeholder:text-slate-600 font-mono"
                                placeholder={`Nhập ${confirmationWord}...`}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                disabled={isSubmitting}
                                autoFocus
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-slate-800 bg-slate-800/30 flex justify-end gap-3">
                    <button
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isConfirmDisabled}
                        className={`px-4 py-2 text-sm font-bold text-white rounded-lg transition-all flex items-center justify-center gap-2
                            ${isConfirmDisabled 
                                ? 'bg-red-900/50 text-red-500/50 cursor-not-allowed border border-red-900/50' 
                                : 'bg-red-600 hover:bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)] border border-red-500'}`}
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Đang thực thi...
                            </>
                        ) : 'Xác Nhận'}
                    </button>
                </div>
            </div>
        </div>
    );
};
