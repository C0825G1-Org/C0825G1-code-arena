import React, { useState } from 'react';
import { X, Warning } from '@phosphor-icons/react';
import axiosClient from '../../../../shared/services/axiosClient';
import { toast } from 'react-hot-toast';

interface DeleteContestModalProps {
    isOpen: boolean;
    onClose: () => void;
    contestId: number | null;
    contestTitle: string;
    onSuccess: () => void;
}

export const DeleteContestModal = ({ isOpen, onClose, contestId, contestTitle, onSuccess }: DeleteContestModalProps) => {
    const [loading, setLoading] = useState(false);

    if (!isOpen || !contestId) return null;

    const handleDelete = async () => {
        try {
            setLoading(true);
            await axiosClient.delete(`/contests/${contestId}`);
            toast.success('Cuộc thi đã được hủy thành công!');
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi hủy cuộc thi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-slide-up">
                <div className="flex justify-between items-center p-5 border-b border-slate-700/50 bg-slate-800/80">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Warning weight="fill" className="text-red-500" />
                        Xóa Cuộc Thi
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-700/50 hover:bg-slate-600/50 p-1.5 rounded-lg">
                        <X weight="bold" />
                    </button>
                </div>
                <div className="p-6">
                    <p className="text-slate-300 text-base leading-relaxed">
                        Bạn có chắc chắn muốn xóa cuộc thi <strong className="text-white">{contestTitle}</strong>?
                    </p>
                    <p className="text-red-400/90 text-sm mt-3 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                        Lưu ý: Hành động này sẽ hủy cuộc thi và không thể hoàn tác. Các bài tập trong cuộc thi sẽ được mở khóa (nếu không nằm trong cuộc thi nào khác).
                    </p>
                </div>
                <div className="flex justify-end gap-3 p-5 border-t border-slate-700/50 bg-slate-900/30">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors border border-slate-600/50"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={loading}
                        className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg shadow-lg shadow-red-500/20 hover:shadow-red-500/40 transition-all border border-red-500 flex items-center gap-2"
                    >
                        {loading ? 'Đang xử lý...' : 'Xác nhận xóa'}
                    </button>
                </div>
            </div>
        </div>
    );
};
