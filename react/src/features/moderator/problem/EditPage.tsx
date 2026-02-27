import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { ModeratorLayout } from '../components/ModeratorLayout';
import { problemApi, TagDTO } from '../services/problemApi';
import { RootState } from '../../../app/store';

export const EditPage = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const currentUser = useSelector((state: RootState) => state.auth.user);
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [content, setContent] = useState('');
    const [difficulty, setDifficulty] = useState('easy');
    const [difficulties, setDifficulties] = useState<string[]>([]);
    const [allTags, setAllTags] = useState<TagDTO[]>([]);
    const [tagIds, setTagIds] = useState<number[]>([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [timeLimit, setTimeLimit] = useState(1000);
    const [memoryLimit, setMemoryLimit] = useState(256);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const [diffs, tagsData] = await Promise.all([
                    problemApi.getDifficulties(),
                    problemApi.getTags()
                ]);
                setDifficulties(diffs);
                setAllTags(tagsData);
            } catch (err) {
                console.error("Failed to fetch metadata", err);
            }
        };

        const fetchProblem = async () => {
            if (!id) return;
            try {
                const problem = await problemApi.getProblemById(Number(id));
                if (currentUser && currentUser.role !== 'admin' && currentUser.id !== problem.authorId) {
                    toast.warning('Bạn không phải người tạo bài tập này, không thể chỉnh sửa!');
                    navigate('/moderator/problems');
                    return;
                }
                setTitle(problem.title);
                setSlug(problem.slug);
                setContent(problem.description);
                setDifficulty(problem.difficulty);
                setTagIds(problem.tags.map(t => t.id));
                setTimeLimit(problem.timeLimit);
                setMemoryLimit(problem.memoryLimit);
            } catch (error) {
                console.error('Failed to fetch problem:', error);
                toast.error('Lỗi khi tải thông tin bài tập!');
                navigate('/moderator/problems');
            } finally {
                setLoading(false);
            }
        };
        fetchMetadata().then(fetchProblem);
    }, [id, currentUser, navigate]);

    if (loading) {
        return (
            <ModeratorLayout>
                <div className="flex items-center justify-center p-8 mt-10">
                    <i className="ph-bold ph-spinner animate-spin text-3xl text-blue-500"></i>
                </div>
            </ModeratorLayout>
        );
    }

    const handleUpdate = async () => {
        if (!title.trim() || !slug.trim() || !content.trim()) {
            toast.warning('Vui lòng điền đầy đủ Tiêu đề, Slug và Nội dung!');
            return;
        }

        setIsSubmitting(true);
        try {
            await problemApi.updateProblem(Number(id), {
                title,
                slug,
                description: content,
                difficulty,
                tagIds,
                timeLimit,
                memoryLimit
            });
            toast.success('Cập nhật bài tập thành công!');
            navigate('/moderator/problems');
        } catch (error) {
            console.error('Lỗi khi cập nhật bài tập', error);
            toast.error('Có lỗi xảy ra khi cập nhật (có thể trùng slug)! Vui lòng kiểm tra lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ModeratorLayout>
            <header className="h-16 border-b border-[#1e293b] bg-slate-900/50 backdrop-blur flex justify-between items-center px-8 z-10 sticky top-0 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/moderator/problems')} className="text-slate-400 hover:text-white transition-colors">
                        <i className="ph-bold ph-arrow-left text-xl"></i>
                    </button>
                    <h1 className="text-xl font-semibold text-white">Chỉnh Sửa Bài Tập {id ? `#${id}` : ''}</h1>
                </div>
                <button
                    onClick={handleUpdate}
                    disabled={isSubmitting}
                    className={`bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition flex items-center gap-2 shadow-lg shadow-blue-500/20 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isSubmitting ? (
                        <i className="ph-bold ph-spinner animate-spin"></i>
                    ) : (
                        <i className="ph-bold ph-floppy-disk"></i>
                    )}
                    {isSubmitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
            </header>

            {/* Form Content */}
            <div className="flex-1 p-8 bg-[#0f172a]">
                <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left (Main info) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-[#1e293b]/70 backdrop-blur-md rounded-xl p-6 border border-slate-700/50">
                            <h2 className="text-lg font-bold text-white mb-4 border-b border-slate-700/50 pb-2">Thông tin Chung</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Tiêu đề bài toán <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Ví dụ: Tổng hai số"
                                        className="w-full bg-[#1e293b] border border-[#334155] text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Slug (Đường dẫn tĩnh) <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">/problems/</span>
                                        <input
                                            type="text"
                                            value={slug}
                                            onChange={(e) => setSlug(e.target.value)}
                                            placeholder="tong-hai-so"
                                            className="w-full bg-[#1e293b] border border-[#334155] text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block pl-[90px] p-2.5 outline-none transition-all font-mono"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1 flex justify-between">
                                        <span>Nội dung đề bài (Markdown) <span className="text-red-500">*</span></span>
                                        <button className="text-blue-400 text-xs hover:underline">Xem Preview</button>
                                    </label>
                                    <textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        rows={15}
                                        className="w-full bg-[#0f172a] border border-[#334155] text-[#e2e8f0] text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-all font-mono"
                                    />
                                    <p className="mt-2 text-xs text-slate-500">Hỗ trợ Markdown cơ bản. Cấu hình trình chỉnh sửa nâng cao sẽ được thêm sau.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right (Settings) */}
                    <div className="space-y-6">
                        <div className="bg-[#1e293b]/70 backdrop-blur-md rounded-xl p-6 border border-slate-700/50">
                            <h2 className="text-lg font-bold text-white mb-4 border-b border-slate-700/50 pb-2">Phân loại & Giới hạn</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Độ khó</label>
                                    <select
                                        value={difficulty}
                                        onChange={(e) => setDifficulty(e.target.value)}
                                        className="w-full bg-[#1e293b] border border-[#334155] text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
                                        disabled={loading}
                                    >
                                        {difficulties.map(d => (
                                            <option key={d} value={d}>
                                                {d === 'easy' ? '🟢 ' : d === 'medium' ? '🟡 ' : '🔴 '}
                                                {d.charAt(0).toUpperCase() + d.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Tags (Nhãn)</label>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setDropdownOpen(!dropdownOpen)}
                                            className="w-full bg-[#1e293b] border border-[#334155] text-left text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none flex justify-between items-center"
                                            disabled={loading}
                                        >
                                            <span className="truncate">
                                                {tagIds.length === 0 
                                                    ? "Chọn tags..." 
                                                    : `${allTags.filter(t => tagIds.includes(t.id)).map(t => t.name).join(', ')}`}
                                            </span>
                                            <i className={`ph-bold ph-caret-down transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}></i>
                                        </button>

                                        {dropdownOpen && (
                                            <div className="absolute z-10 w-full mt-2 bg-[#1e293b] border border-[#334155] rounded-lg shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
                                                {loading ? (
                                                    <div className="p-3 text-sm text-center text-slate-400">Đang tải tags...</div>
                                                ) : allTags.length === 0 ? (
                                                    <div className="p-3 text-sm text-center text-slate-500">Chưa có tag nào trong DB</div>
                                                ) : (
                                                    <div className="p-2 space-y-1">
                                                        {allTags.map(tag => {
                                                            const isSelected = tagIds.includes(tag.id);
                                                            return (
                                                                <label
                                                                    key={tag.id}
                                                                    className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded hover:bg-[#334155] transition-colors"
                                                                >
                                                                    <div className={`w-4 h-4 rounded border flex flex-shrink-0 items-center justify-center transition-colors ${
                                                                        isSelected 
                                                                            ? 'bg-blue-500 border-blue-500' 
                                                                            : 'border-slate-500 bg-transparent'
                                                                    }`}>
                                                                        {isSelected && <i className="ph-bold ph-check text-white text-xs"></i>}
                                                                    </div>
                                                                    <input
                                                                        type="checkbox"
                                                                        className="hidden"
                                                                        checked={isSelected}
                                                                        onChange={() => {
                                                                            if (isSelected) {
                                                                                setTagIds(tagIds.filter(id => id !== tag.id));
                                                                            } else {
                                                                                setTagIds([...tagIds, tag.id]);
                                                                            }
                                                                        }}
                                                                    />
                                                                    <span className={`text-sm ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                                                                        {tag.name}
                                                                    </span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <hr className="border-slate-700/50" />

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Giới hạn thời gian (Time Limit)</label>
                                    <div className="flex items-center">
                                        <input
                                            type="number"
                                            value={timeLimit}
                                            onChange={(e) => setTimeLimit(Number(e.target.value))}
                                            className="flex-1 bg-[#1e293b] border border-[#334155] text-white text-sm rounded-l-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-all font-mono"
                                        />
                                        <span className="bg-[#334155] border border-l-0 border-[#334155] text-slate-300 px-3 py-2.5 rounded-r-lg font-mono text-sm">ms</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Giới hạn bộ nhớ (Memory Limit)</label>
                                    <div className="flex items-center">
                                        <input
                                            type="number"
                                            value={memoryLimit}
                                            onChange={(e) => setMemoryLimit(Number(e.target.value))}
                                            className="flex-1 bg-[#1e293b] border border-[#334155] text-white text-sm rounded-l-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-all font-mono"
                                        />
                                        <span className="bg-[#334155] border border-l-0 border-[#334155] text-slate-300 px-3 py-2.5 rounded-r-lg font-mono text-sm">MB</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#1e293b]/70 backdrop-blur-md rounded-xl p-6 border border-indigo-500/30">
                            <div className="flex justify-between items-center mb-4 border-b border-indigo-500/20 pb-2">
                                <h2 className="text-lg font-bold text-indigo-400 flex items-center gap-2">
                                    <i className="ph-bold ph-flask"></i> Test Cases
                                </h2>
                                <span className="bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded text-xs font-bold font-mono">3 Tests</span>
                            </div>
                            <button
                                onClick={() => navigate(`/moderator/problems/${id}/testcases`)}
                                className="w-full bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/50 px-4 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                            >
                                <i className="ph-bold ph-upload-simple"></i> Quản lý Test Cases
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </ModeratorLayout>
    );
};
