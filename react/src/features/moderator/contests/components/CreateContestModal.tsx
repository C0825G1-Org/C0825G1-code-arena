import React, { useState } from 'react';
import { X, CalendarPlus, MagnifyingGlass, Eye } from '@phosphor-icons/react';
import axiosClient from '../../../../shared/services/axiosClient';
import { toast } from 'react-hot-toast';
import { problemApi, ProblemResponseDTO } from '../../services/problemApi';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../app/store';
import { ProblemDetailSubModal } from './ProblemDetailSubModal';

interface CreateContestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateContestModal = ({ isOpen, onClose, onSuccess }: CreateContestModalProps) => {
    const [loading, setLoading] = useState(false);
    const [problems, setProblems] = useState<ProblemResponseDTO[]>([]);
    const [loadingProblems, setLoadingProblems] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProblem, setSelectedProblem] = useState<ProblemResponseDTO | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
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
            const data = await problemApi.getProblems(true);
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
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const toggleProblem = (id: number) => {
        setFormData(prev => {
            const isSelected = prev.problemIds.includes(id);
            const newIds = isSelected
                ? prev.problemIds.filter(pid => pid !== id)
                : [...prev.problemIds, id];
            return { ...prev, problemIds: newIds };
        });
    };

    const openDetail = (p: ProblemResponseDTO) => {
        setSelectedProblem(p);
        setIsDetailOpen(true);
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
            setSearchQuery('');

            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo cuộc thi.');
        } finally {
            setLoading(false);
        }
    };

    const filteredProblems = problems.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toString() === searchQuery
    );

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
                    <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
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
                                rows={3}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors placeholder:text-slate-500"
                            />
                        </div>

                        {/* Problem Selection Section */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-slate-300 flex items-center justify-between">
                                <span>Chọn bài tập ({formData.problemIds.length} đã chọn) *</span>
                                <span className="text-xs text-slate-500 font-normal">Tất cả bài tập đã có testcase</span>
                            </label>

                            {/* Search Input */}
                            <div className="relative">
                                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm bài tập..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                />
                            </div>

                            {/* Problem List */}
                            <div className="bg-slate-900/50 border border-slate-700 rounded-lg overflow-hidden flex flex-col min-h-[160px] max-h-[240px]">
                                {loadingProblems ? (
                                    <div className="flex items-center justify-center flex-1 text-slate-500 text-sm">
                                        <div className="w-4 h-4 border-2 border-slate-500 border-t-white rounded-full animate-spin mr-2"></div>
                                        Đang tải bài tập...
                                    </div>
                                ) : filteredProblems.length === 0 ? (
                                    <div className="flex items-center justify-center flex-1 text-slate-500 text-sm italic py-8">
                                        Không tìm thấy bài tập phù hợp
                                    </div>
                                ) : (
                                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                                        {filteredProblems.map(p => {
                                            const isSelected = formData.problemIds.includes(p.id);
                                            return (
                                                <div
                                                    key={p.id}
                                                    className={`flex items-center gap-3 p-3 border-b border-slate-800/50 last:border-none transition-colors group ${isSelected ? 'bg-emerald-500/5' : 'hover:bg-slate-800/50'}`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        id={`prob-${p.id}`}
                                                        checked={isSelected}
                                                        onChange={() => toggleProblem(p.id)}
                                                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 transition-all cursor-pointer"
                                                    />
                                                    <label
                                                        htmlFor={`prob-${p.id}`}
                                                        className="flex-1 text-sm text-slate-200 cursor-pointer font-medium truncate"
                                                    >
                                                        <span className="text-slate-500 font-mono text-xs mr-2">#{p.id}</span>
                                                        {p.title}
                                                        <span className={`ml-3 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${p.difficulty === 'easy' ? 'text-emerald-400 bg-emerald-500/10' : p.difficulty === 'medium' ? 'text-amber-400 bg-amber-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                                                            {p.difficulty}
                                                        </span>
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => openDetail(p)}
                                                        className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded transition-all opacity-0 group-hover:opacity-100"
                                                        title="Xem chi tiết"
                                                    >
                                                        <Eye weight="bold" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5 pt-2">
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

            <ProblemDetailSubModal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                problem={selectedProblem}
            />
        </div>
    );
};
