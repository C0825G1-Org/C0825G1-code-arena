import React from 'react';

interface RestoreModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description?: string;
    isRestoring?: boolean;
}

export const RestoreModal: React.FC<RestoreModalProps> = ({ isOpen, onClose, onConfirm, title, description, isRestoring }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#1e293b] border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-md p-6 transform scale-100 transition-all">
                <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 border border-green-500/20">
                        <i className="ph-fill ph-arrow-u-up-left text-2xl text-green-500"></i>
                    </div>
                    <div className="pt-1">
                        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                        <p className="text-slate-300 text-sm leading-relaxed">
                            {description || 'Bạn có chắc chắn muốn khôi phục mục này?'}
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 font-medium">
                    <button
                        onClick={onClose}
                        disabled={isRestoring}
                        className="px-5 py-2.5 text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 border border-slate-700"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isRestoring}
                        className="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors shadow-lg shadow-green-500/20 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isRestoring ? (
                            <>
                                <i className="ph-bold ph-spinner animate-spin text-lg"></i> Đang khôi phục...
                            </>
                        ) : (
                            'Xác nhận Khôi phục'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
