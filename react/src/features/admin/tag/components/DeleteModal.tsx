import React from 'react';
import { WarningCircle, Spinner } from '@phosphor-icons/react';

interface DeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description?: string;
    isDeleting?: boolean;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({ isOpen, onClose, onConfirm, title, description, isDeleting }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-md p-6 transform scale-100 transition-all font-sans">
                <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20">
                        <WarningCircle weight="fill" className="text-2xl text-red-500" />
                    </div>
                    <div className="pt-1">
                        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                        <p className="text-slate-300 text-sm leading-relaxed">
                            {description || 'Bạn có chắc chắn muốn xóa mục này? Hành động này không thể hoàn tác.'}
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 font-medium">
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="px-5 py-2.5 text-slate-300 bg-slate-900 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 border border-slate-700"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isDeleting ? (
                            <>
                                <Spinner weight="bold" className="animate-spin text-lg" /> Đang xóa...
                            </>
                        ) : (
                            'Xác nhận Xóa'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
