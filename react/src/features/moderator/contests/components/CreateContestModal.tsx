import React, { useState } from 'react';
import { X, CalendarPlus } from '@phosphor-icons/react';
import axiosClient from '../../../../shared/services/axiosClient';
import { toast } from 'react-hot-toast';
import { problemApi, ProblemResponseDTO } from '../../services/problemApi';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../app/store';

interface CreateContestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateContestModal = ({ isOpen, onClose, onSuccess }: CreateContestModalProps) => {
    const [loading, setLoading] = useState(false);
    const [problems, setProblems] = useState<ProblemResponseDTO[]>([]);
    const [loadingProblems, setLoadingProblems] = useState(false);
    const user = useSelector((state: RootState) => state.auth.user);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        problemIds: [] as number[],
    });

    // Fetch problems when modal opens
    React.useEffect(() => {
        if (isOpen) {
            fetchProblems();
        }
    }, [isOpen]);

    const fetchProblems = async () => {
        try {
            setLoadingProblems(true);
            const data = await problemApi.getProblems();
            // User requested that only problems with testcases ('ready') are selectable.
            const selectableProblems = data.filter(p => p.testcaseStatus === 'ready');
            setProblems(selectableProblems);
        } catch (error) {
            toast.error('Không thể tải danh sách bài tập.');
        } finally {
            setLoadingProblems(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        if (e.target.name === 'problemIds') {
            const options = (e.target as HTMLSelectElement).options;
            const values: number[] = [];
            for (let i = 0; i < options.length; i++) {
                if (options[i].selected) {
                    values.push(parseInt(options[i].value));
                }
            }
            setFormData({ ...formData, problemIds: values });
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic frontend validation
        const start = new Date(formData.startTime).getTime();
        const end = new Date(formData.endTime).getTime();

        if (start >= end) {
            toast.error('Thời gian kết thúc phải sau thời gian bắt đầu.');
            return;
        }

        if (formData.problemIds.length === 0) {
            toast.error('Vui lòng chọn ít nhất 1 bài tập cho cuộc thi.');
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

            const payload = {
                title: formData.title,
                description: formData.description,
                startTime: formatForOutput(formData.startTime),
                endTime: formatForOutput(formData.endTime),
                problemIds: formData.problemIds
            };

            await axiosClient.post(`/contests`, payload);
            toast.success('Tạo cuộc thi mới thành công!');

            // Reset form gracefully
            setFormData({
                title: '',
                description: '',
                startTime: '',
                endTime: '',
                problemIds: [],
            });

            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo cuộc thi.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-slide-up">
                <div className="flex justify-between items-center p-5 border-b border-slate-700/50 bg-slate-800/80">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <CalendarPlus weight="duotone" className="text-emerald-400" />
                        Tạo Cuộc Thi Mới
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-700/50 hover:bg-slate-600/50 p-1.5 rounded-lg">
                        <X weight="bold" />
                    </button>
                </div>

                <form onSubmit={handleSave}>
                    <div className="p-6 space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Tên cuộc thi *</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Nhập tên cuộc thi..."
                                required
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors placeholder:text-slate-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Mô tả (tùy chọn)</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Nhập mô tả hoặc thể lệ cuộc thi..."
                                rows={4}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors placeholder:text-slate-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                                <span>Bài tập trong cuộc thi *</span>
                                <span className="text-xs text-slate-500 font-normal">Giữ phím {navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'} để chọn nhiều</span>
                            </label>
                            {loadingProblems ? (
                                <div className="text-slate-500 text-sm py-2">Đang tải danh sách bài tập...</div>
                            ) : (
                                <select
                                    multiple
                                    name="problemIds"
                                    value={formData.problemIds.map(String)}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors min-h-[120px]"
                                >
                                    {problems.length === 0 ? (
                                        <option disabled value="">Chưa có bài tập nào khả dụng</option>
                                    ) : (
                                        problems.map(p => (
                                            <option key={p.id} value={p.id} className="py-1 px-2 border-b border-slate-800/50 hover:bg-slate-800 break-words max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                                                {p.testcaseStatus === 'not_uploaded' ? '⚠️ ' : ''} [{p.difficulty.toUpperCase()}] {p.title}
                                            </option>
                                        ))
                                    )}
                                </select>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Bắt đầu *</label>
                                <input
                                    type="datetime-local"
                                    name="startTime"
                                    value={formData.startTime}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Kết thúc *</label>
                                <input
                                    type="datetime-local"
                                    name="endTime"
                                    value={formData.endTime}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
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
                            className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all border border-emerald-500 flex items-center justify-center min-w-[120px]"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : 'Tạo Cuộc Thi'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
