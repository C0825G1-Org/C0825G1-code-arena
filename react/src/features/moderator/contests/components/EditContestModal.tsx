import React, { useState, useEffect } from 'react';
import { X, CalendarStar } from '@phosphor-icons/react';
import axiosClient from '../../../../shared/services/axiosClient';
import { toast } from 'react-hot-toast';

interface EditContestModalProps {
    isOpen: boolean;
    onClose: () => void;
    contestId: number | null;
    onSuccess: () => void;
}

export const EditContestModal = ({ isOpen, onClose, contestId, onSuccess }: EditContestModalProps) => {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
    });

    useEffect(() => {
        if (isOpen && contestId) {
            fetchContestDetail();
        }
    }, [isOpen, contestId]);

    const [originalData, setOriginalData] = useState({
        startTimeIso: '',
        endTimeIso: '',
        formattedStartTime: '',
        formattedEndTime: ''
    });

    const formatForInput = (isoString: string) => {
        // Backend returns LocalDateTime string like '2026-02-27T17:00:00'
        return isoString ? isoString.substring(0, 16) : '';
    };

    const fetchContestDetail = async () => {
        try {
            setFetching(true);
            const res: any = await axiosClient.get(`/contests/${contestId}`);

            const formattedStart = res.startTime ? formatForInput(res.startTime) : '';
            const formattedEnd = res.endTime ? formatForInput(res.endTime) : '';

            setOriginalData({
                startTimeIso: res.startTime || '',
                endTimeIso: res.endTime || '',
                formattedStartTime: formattedStart,
                formattedEndTime: formattedEnd
            });

            setFormData({
                title: res.title || '',
                description: res.description || '',
                startTime: formattedStart,
                endTime: formattedEnd
            });
        } catch (error) {
            toast.error('Lỗi khi lấy thông tin cuộc thi');
            onClose();
        } finally {
            setFetching(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        const start = new Date(formData.startTime).getTime();
        const end = new Date(formData.endTime).getTime();

        if (start >= end) {
            toast.error('Thời gian kết thúc phải sau thời gian bắt đầu.');
            return;
        }

        if (end - start > 3 * 60 * 60 * 1000) {
            toast.error('Thời gian diễn ra cuộc thi tối đa là 3 tiếng.');
            return;
        }

        try {
            setLoading(true);

            const formatForOutput = (localString: string) => {
                if (!localString) return '';
                // Append :00 to match backend LocalDateTime format 'YYYY-MM-DDThh:mm:ss'
                return localString.length === 16 ? `${localString}:00` : localString;
            };

            // If the user didn't change the input from the originally formatted value, send the exact original ISO string
            // Otherwise, send the locally edited string with :00 appended to retain exact local time
            const finalStartTime = formData.startTime === originalData.formattedStartTime && formData.startTime !== ''
                ? originalData.startTimeIso
                : formatForOutput(formData.startTime);

            const finalEndTime = formData.endTime === originalData.formattedEndTime && formData.endTime !== ''
                ? originalData.endTimeIso
                : formatForOutput(formData.endTime);

            const payload = {
                title: formData.title,
                description: formData.description,
                startTime: finalStartTime,
                endTime: finalEndTime
            };
            await axiosClient.put(`/contests/${contestId}`, payload);
            toast.success('Cập nhật cuộc thi thành công!');
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !contestId) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-slide-up">
                <div className="flex justify-between items-center p-5 border-b border-slate-700/50 bg-slate-800/80">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <CalendarStar weight="duotone" className="text-orange-400" />
                        Chỉnh Sửa Cuộc Thi
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-700/50 hover:bg-slate-600/50 p-1.5 rounded-lg">
                        <X weight="bold" />
                    </button>
                </div>

                {fetching ? (
                    <div className="p-12 text-center text-slate-400">Đang tải thông tin...</div>
                ) : (
                    <form onSubmit={handleSave}>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Tên cuộc thi</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Mô tả (tùy chọn)</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Bắt đầu</label>
                                    <input
                                        type="datetime-local"
                                        name="startTime"
                                        value={formData.startTime}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Kết thúc</label>
                                    <input
                                        type="datetime-local"
                                        name="endTime"
                                        value={formData.endTime}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 p-5 border-t border-slate-700/50 bg-slate-900/30">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors border border-slate-600/50"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-5 py-2.5 text-sm font-medium text-white bg-orange-600 hover:bg-orange-500 rounded-lg shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all border border-orange-500"
                            >
                                {loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};
