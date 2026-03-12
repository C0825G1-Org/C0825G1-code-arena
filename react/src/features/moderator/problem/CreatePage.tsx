import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ModeratorLayout } from '../components/ModeratorLayout';
import { problemApi, TagDTO, LanguageDTO } from '../services/problemApi';

export const CreatePage = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [content, setContent] = useState('# Đề bài\nCho hai số nguyên A và B. Hãy tính tổng của chúng.\n\n### Input\nMột dòng duy nhất chứa hai số nguyên A, B (-10^9 <= A, B <= 10^9).\n\n### Output\nTổng của A và B.');
    const [difficulty, setDifficulty] = useState('easy');
    const [tagIds, setTagIds] = useState<number[]>([]);
    const [timeLimit, setTimeLimit] = useState(1000);
    const [memoryLimit, setMemoryLimit] = useState(256);

    const [difficulties, setDifficulties] = useState<string[]>([]);
    const [allTags, setAllTags] = useState<TagDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // I/O Template states
    const [allLanguages, setAllLanguages] = useState<LanguageDTO[]>([]);
    const [ioTemplates, setIoTemplates] = useState<{ languageId: number, templateCode: string }[]>([]);
    const [selectedLangId, setSelectedLangId] = useState<number | ''>('');

    useEffect(() => {
        const fetchFormData = async () => {
            setLoading(true);
            try {
                const [diffs, tagsData, langsData] = await Promise.all([
                    problemApi.getDifficulties(),
                    problemApi.getTags(),
                    problemApi.getLanguages()
                ]);
                setDifficulties(diffs);
                setAllTags(tagsData);
                setAllLanguages(langsData);
                if (diffs.length > 0) setDifficulty(diffs[0]);
                if (langsData.length > 0) setSelectedLangId(langsData[0].id);
            } catch (error) {
                console.error('Lỗi khi tải dữ liệu form', error);
            } finally {
                setLoading(false);
            }
        };
        fetchFormData();
    }, []);

    const handleSave = async () => {
        if (!title.trim() || !slug.trim() || !content.trim()) {
            toast.warning('Vui lòng điền đầy đủ Tiêu đề, Slug và Nội dung!');
            return;
        }

        if (timeLimit < 100 || timeLimit > 5000) {
            toast.warning('Giới hạn thời gian phải từ 100ms đến 5000ms!');
            return;
        }

        if (memoryLimit < 16 || memoryLimit > 1024) {
            toast.warning('Giới hạn bộ nhớ phải từ 16MB đến 1024MB!');
            return;
        }

        setIsSubmitting(true);
        try {
            await problemApi.createProblem({
                title,
                slug,
                description: content,
                difficulty,
                tagIds,
                timeLimit,
                memoryLimit,
                ioTemplates: ioTemplates.filter(t => t.templateCode.trim() !== '')
            });
            toast.success('Tạo bài tập thành công!');
            navigate('/moderator/problems');
        } catch (error) {
            console.error('Lỗi khi tạo bài tập', error);
            toast.error('Có lỗi xảy ra khi tạo bài tập! Vui lòng kiểm tra lại (có thể do trùng Slug).');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ModeratorLayout>
            <header className="min-h-[64px] py-3 border-b border-[#1e293b] bg-slate-900/50 backdrop-blur flex flex-wrap justify-between items-center gap-4 px-8 z-10 sticky top-0 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/moderator/problems')} className="text-slate-400 hover:text-white transition-colors">
                        <i className="ph-bold ph-arrow-left text-xl"></i>
                    </button>
                    <h1 className="text-xl font-semibold text-white">Soạn Bài Tập Mới</h1>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSubmitting}
                    className={`bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition flex items-center gap-2 shadow-lg shadow-blue-500/20 whitespace-nowrap ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isSubmitting ? (
                        <i className="ph-bold ph-spinner animate-spin"></i>
                    ) : (
                        <i className="ph-bold ph-floppy-disk"></i>
                    )}
                    {isSubmitting ? 'Đang lưu...' : 'Lưu & Tạo mới'}
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
                                    {/* Temporary basic textarea for Markdown until a rich editor is integrated */}
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

                        {/* I/O Templates Section */}
                        <div className="bg-[#1e293b]/70 backdrop-blur-md rounded-xl p-6 border border-slate-700/50 mt-6">
                            <h2 className="text-lg font-bold text-white mb-4 border-b border-slate-700/50 pb-2">I/O Code Templates (Dành cho thí sinh)</h2>
                            <div className="bg-blue-600/10 border border-blue-500/20 rounded-lg p-4 mb-4">
                                <p className="text-sm text-blue-100 flex items-center gap-2">
                                    <i className="ph-bold ph-info text-blue-400"></i>
                                    Thiết lập code mẫu (đọc/ghi dữ liệu) cho từng ngôn ngữ để thí sinh tập trung vào logic.
                                </p>
                                <p className="text-xs text-slate-400 mt-2">
                                    Sử dụng <code className="text-blue-400 font-mono font-bold">// {"{{USER_CODE}}"}</code> để đánh dấu vị trí code của thí sinh sẽ được chèn vào.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex gap-4 items-end">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Chọn ngôn ngữ</label>
                                        <select
                                            value={selectedLangId}
                                            onChange={(e) => setSelectedLangId(Number(e.target.value))}
                                            className="w-full bg-[#1e293b] border border-[#334155] text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
                                        >
                                            <option value="">-- Chọn ngôn ngữ --</option>
                                            {allLanguages.map(lang => (
                                                <option key={lang.id} value={lang.id}>{lang.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className={`px-4 py-2.5 rounded-lg text-xs border font-medium flex items-center gap-2 ${ioTemplates.find(t => t.languageId === selectedLangId)
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                        }`}>
                                        {ioTemplates.find(t => t.languageId === selectedLangId) ? (
                                            <>
                                                <i className="ph-bold ph-check-circle"></i>
                                                Đã có template
                                            </>
                                        ) : (
                                            <>
                                                <i className="ph-bold ph-question"></i>
                                                Chưa có template
                                            </>
                                        )}
                                    </div>
                                </div>

                                {selectedLangId && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="block text-sm font-medium text-slate-300">Template code</label>
                                        </div>
                                        <textarea
                                            value={ioTemplates.find(t => t.languageId === selectedLangId)?.templateCode || ''}
                                            onChange={(e) => {
                                                const newCode = e.target.value;
                                                setIoTemplates(prev => {
                                                    const existing = prev.find(t => t.languageId === selectedLangId);
                                                    if (existing) {
                                                        return prev.map(t => t.languageId === selectedLangId ? { ...t, templateCode: newCode } : t);
                                                    } else {
                                                        return [...prev, { languageId: selectedLangId as number, templateCode: newCode }];
                                                    }
                                                });
                                            }}
                                            rows={12}
                                            placeholder={`Ví dụ (JS):\nconst fs = require('fs');\n\nfunction solve() {\n   // {{USER_CODE}}\n}\nsolve();`}
                                            className="w-full bg-[#0f172a] border border-[#334155] text-[#e2e8f0] text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-all font-mono"
                                        />
                                        {!ioTemplates.find(t => t.languageId === selectedLangId)?.templateCode.includes('// {{USER_CODE}}') && (
                                            <p className="mt-2 text-xs text-amber-400 flex items-center gap-1">
                                                <i className="ph-bold ph-warning"></i>
                                                Thiếu thẻ <strong>// {"{{USER_CODE}}"}</strong>
                                            </p>
                                        )}
                                    </div>
                                )}
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
                                                                    <div className={`w-4 h-4 rounded border flex flex-shrink-0 items-center justify-center transition-colors ${isSelected
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
                                            className="flex-1 min-w-0 bg-[#1e293b] border border-[#334155] text-white text-sm rounded-l-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-all font-mono"
                                        />
                                        <span className="shrink-0 bg-[#334155] border border-l-0 border-[#334155] text-slate-300 px-3 py-2.5 rounded-r-lg font-mono text-sm">ms</span>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500 italic">Giới hạn: 100ms - 5000ms</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Giới hạn bộ nhớ (Memory Limit)</label>
                                    <div className="flex items-center">
                                        <input
                                            type="number"
                                            value={memoryLimit}
                                            onChange={(e) => setMemoryLimit(Number(e.target.value))}
                                            className="flex-1 min-w-0 bg-[#1e293b] border border-[#334155] text-white text-sm rounded-l-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-all font-mono"
                                        />
                                        <span className="shrink-0 bg-[#334155] border border-l-0 border-[#334155] text-slate-300 px-3 py-2.5 rounded-r-lg font-mono text-sm">MB</span>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500 italic">Giới hạn: 16MB - 1024MB</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </ModeratorLayout>
    );
};
