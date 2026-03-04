import React from 'react';
import { X, Warning, PaperPlaneRight, SignOut } from '@phosphor-icons/react';

interface ConfirmExitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isSubmitting: boolean;
}

export const ConfirmExitModal: React.FC<ConfirmExitModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    isSubmitting
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-800 border-2 border-red-500/30 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col transform transition-all scale-100 opacity-100">
                {/* Header */}
                <div className="px-6 py-6 border-b border-slate-700 bg-red-500/5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-500/20 rounded-2xl shrink-0">
                            <Warning weight="fill" className="text-red-500 text-3xl" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Kết thúc bài thi sớm?</h2>
                            <p className="text-red-400/80 text-xs font-medium uppercase tracking-wider mt-0.5">Hành động không thể hoàn tác</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="px-8 py-8 space-y-4">
                    <p className="text-slate-300 leading-relaxed">
                        Bạn có chắc chắn muốn kết thúc bài thi sớm? <br />
                        <span className="text-white font-semibold">Nếu xác nhận:</span>
                    </p>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-3 text-sm text-slate-400">
                            <div className="mt-1 p-1 bg-red-500/10 rounded-full"><X size={14} className="text-red-400" /></div>
                            <span>Bạn <b className="text-red-300">không thể quay lại</b> để tiếp tục làm bài.</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm text-slate-400">
                            <div className="mt-1 p-1 bg-emerald-500/10 rounded-full"><PaperPlaneRight size={14} className="text-emerald-400" /></div>
                            <span>Hệ thống sẽ <b className="text-emerald-300">tự động nộp bài</b> của tất cả các câu hỏi dựa trên code hiện tại của bạn.</span>
                        </li>
                    </ul>
                </div>

                {/* Footer */}
                <div className="px-6 py-6 bg-slate-900/30 flex gap-3">
                    <button
                        disabled={isSubmitting}
                        onClick={onClose}
                        className="flex-1 py-3 px-4 rounded-xl font-bold bg-slate-700 hover:bg-slate-600 text-white transition-all disabled:opacity-50"
                    >
                        Tiếp tục thi
                    </button>
                    <button
                        disabled={isSubmitting}
                        onClick={onConfirm}
                        className="flex-[1.5] py-3 px-4 rounded-xl font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <SignOut size={20} weight="bold" className="group-hover:translate-x-1 transition-transform" />
                        )}
                        {isSubmitting ? 'Đang nộp bài...' : 'Xác nhận Kết thúc'}
                    </button>
                </div>
            </div>
        </div>
    );
};
