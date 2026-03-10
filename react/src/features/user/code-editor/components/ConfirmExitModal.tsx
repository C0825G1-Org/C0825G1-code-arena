import React from 'react';
import { X, Warning, PaperPlaneRight, SignOut, Info } from '@phosphor-icons/react';

export interface ConfirmExitModalProps {
    isOpen: boolean;
    onClose?: () => void;
    onCancel?: () => void;
    onConfirm: () => void;
    isSubmitting?: boolean;
    isExamMode?: boolean;
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
}

export const ConfirmExitModal: React.FC<ConfirmExitModalProps> = ({
    isOpen,
    onClose,
    onCancel,
    onConfirm,
    isSubmitting,
    isExamMode,
    title,
    description,
    confirmText,
    cancelText
}) => {
    if (!isOpen) return null;

    const isCustom = !!title;
    const finalClose = onCancel || onClose || (() => { });

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`bg-slate-800 border-2 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col transform transition-all scale-100 opacity-100 ${isCustom ? 'border-blue-500/30' : 'border-red-500/30'}`}>
                {/* Header */}
                <div className={`px-6 py-6 border-b border-slate-700 ${isCustom ? 'bg-blue-500/5' : 'bg-red-500/5'}`}>
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl shrink-0 ${isCustom ? 'bg-blue-500/20' : 'bg-red-500/20'}`}>
                            {isCustom ? <Info weight="fill" className="text-blue-500 text-3xl" /> : <Warning weight="fill" className="text-red-500 text-3xl" />}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{title || 'Kết thúc bài thi sớm?'}</h2>
                            {!isCustom && <p className="text-red-400/80 text-xs font-medium uppercase tracking-wider mt-0.5">Hành động không thể hoàn tác</p>}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="px-8 py-8 space-y-4">
                    {description ? (
                        <p className="text-slate-300 leading-relaxed text-sm">{description}</p>
                    ) : (
                        <>
                            <p className="text-slate-300 leading-relaxed">
                                Bạn có chắc chắn muốn kết thúc và thoát khỏi bài thi?
                            </p>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3 text-sm text-slate-400">
                                    <div className="mt-1 p-1 bg-red-500/10 rounded-full"><X size={14} className="text-red-400" /></div>
                                    <span>Bạn <b className="text-red-300">không thể quay lại</b> để tiếp tục làm bài sau khi thoát.</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm text-amber-300 bg-amber-500/10 rounded-xl p-3 border border-amber-500/20">
                                    <div className="mt-0.5 shrink-0">⚠️</div>
                                    <span>
                                        <b>Hệ thống KHÔNG tự nộp bài thay bạn.</b><br />
                                        Hãy đảm bảo bạn đã bấm <b>"Nộp bài"</b> cho tất cả các câu hỏi trước khi xác nhận thoát.
                                    </span>
                                </li>
                            </ul>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-6 bg-slate-900/30 flex gap-3">
                    <button
                        disabled={isSubmitting}
                        onClick={finalClose}
                        className="flex-1 py-3 px-4 rounded-xl font-bold bg-slate-700 hover:bg-slate-600 text-white transition-all disabled:opacity-50"
                    >
                        {cancelText || 'Tiếp tục thi'}
                    </button>
                    <button
                        disabled={isSubmitting}
                        onClick={onConfirm}
                        className={`flex-[1.5] py-3 px-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 group disabled:opacity-70 ${isCustom ? 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20' : 'bg-red-600 hover:bg-red-500 shadow-lg shadow-red-900/20'}`}
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            isCustom ? <PaperPlaneRight size={20} weight="bold" /> : <SignOut size={20} weight="bold" className="group-hover:translate-x-1 transition-transform" />
                        )}
                        {isSubmitting ? 'Đang xử lý...' : (confirmText || 'Xác nhận Thoát')}
                    </button>
                </div>
            </div>
        </div>
    );
};
