import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { ModeratorLayout } from '../components/ModeratorLayout';
import { problemApi, ProblemResponseDTO } from '../services/problemApi';
import { DeleteModal } from './DeleteModal';
import { RootState } from '../../../app/store';
import { DiscussionModal } from './DiscussionModal';

export const ListPage = () => {
    const navigate = useNavigate();
    const currentUser = useSelector((state: RootState) => state.auth.user);
    const [searchTerm, setSearchTerm] = useState('');
    const [difficulty, setDifficulty] = useState('');
    const [difficulties, setDifficulties] = useState<string[]>([]);
    const [problems, setProblems] = useState<ProblemResponseDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [problemToDelete, setProblemToDelete] = useState<ProblemResponseDTO | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Discussion Modal state
    const [discussionModalOpen, setDiscussionModalOpen] = useState(false);
    const [selectedProblemId, setSelectedProblemId] = useState<number | null>(null);
    const [selectedProblemTitle, setSelectedProblemTitle] = useState<string | null>(null);

    const handleDeleteConfirm = async () => {
        if (!problemToDelete) return;
        setIsDeleting(true);
        try {
            await problemApi.deleteProblem(problemToDelete.id);
            setProblems(problems.filter(p => p.id !== problemToDelete.id));
            setDeleteModalOpen(false);
            setProblemToDelete(null);
            toast.success('Xóa bài tập thành công!');
        } catch (e) {
            console.error(e);
            toast.error('Lỗi khi xóa bài tập! Vui lòng thử lại.');
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [problemsData, difficultiesData] = await Promise.all([
                    problemApi.getProblems(true),
                    problemApi.getDifficulties()
                ]);
                // Filter problems: Admins see all, Moderators see only their own
                const filteredProblems = problemsData.filter(prob =>
                    currentUser?.role === 'admin' || prob.authorId === currentUser?.id
                );

                setProblems(filteredProblems);
                setDifficulties(difficultiesData);
            } catch (err: any) {
                setError('Lỗi khi tải dữ liệu. Vui lòng thử lại sau.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUser]);

    // Reset pages on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, difficulty]);

    // Derived states for pagination & filter
    const filteredProblemsList = problems.filter((prob) => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = prob.title.toLowerCase().includes(term) || String(prob.id) === term;
        const matchesDifficulty = difficulty ? prob.difficulty === difficulty : true;
        return matchesSearch && matchesDifficulty;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentProblems = filteredProblemsList.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredProblemsList.length / itemsPerPage);

    // Change pages
    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    const getDifficultyClass = (level: string) => {
        switch (level) {
            case 'easy': return 'bg-green-500/10 text-green-400 border-green-500/20';
            case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'hard': return 'bg-red-500/10 text-red-400 border-red-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    return (
        <ModeratorLayout headerTitle="Quản Lý Bài Tập">
            {/* Header Title inside Content Area replacing the generic header */}
            <div className="flex-1 overflow-y-auto p-8 bg-[#0f172a]">

                <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-6">
                    {/* Search & Filter */}
                    <div className="flex flex-wrap gap-4">
                        <div className="relative w-72">
                            <i className="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                            <input
                                type="text"
                                placeholder="Tìm theo tên diễn đạt, ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-[#1e293b] border border-[#334155] text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block pl-10 p-2.5 outline-none transition-all"
                            />
                        </div>
                        <select
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                            className="bg-[#1e293b] border border-[#334155] text-slate-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none w-full md:w-auto"
                        >
                            <option value="">Tất cả độ khó </option>
                            {difficulties.map(d => (
                                <option key={d} value={d}>
                                    {d.charAt(0).toUpperCase() + d.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={() => navigate('/moderator/problems/create')}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 whitespace-nowrap"
                    >
                        <i className="ph-bold ph-plus"></i> Soạn bài mới
                    </button>
                </div>

                {/* Table Card */}
                <div className="bg-[#1e293b]/70 backdrop-blur-md rounded-xl overflow-x-auto border border-slate-700/50">
                    <table className="w-full text-sm text-left text-slate-400 min-w-[800px]">
                        <thead className="text-xs uppercase bg-[#1e293b] text-slate-300">
                            <tr>
                                <th className="px-6 py-4 font-semibold">ID</th>
                                <th className="px-6 py-4 font-semibold">Tên bài toán</th>
                                <th className="px-6 py-4 font-semibold">Độ khó</th>
                                <th className="px-6 py-4 font-semibold text-center">Trạng thái Test Cases</th>
                                <th className="px-6 py-4 font-semibold text-center">Danh Mục</th>
                                <th className="px-6 py-4 font-semibold text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-slate-400">Đang tải dữ liệu...</td>
                                </tr>
                            )}
                            {error && (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-red-500">{error}</td>
                                </tr>
                            )}
                            {!loading && !error && problems.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-slate-400">Không có bài tập nào.</td>
                                </tr>
                            )}
                            {!loading && currentProblems.map((prob) => (
                                <tr key={prob.id} className="border-b border-[#1e293b] hover:bg-[#1e293b]/50 transition-colors">
                                    <td className="px-6 py-4 font-mono">#{prob.id}</td>
                                    <td className="px-6 py-4 font-medium text-white max-w-[250px] truncate" title={prob.title}>
                                        {prob.title}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`${getDifficultyClass(prob.difficulty)} border px-2 py-1 rounded text-xs font-semibold`}>
                                            {prob.difficulty}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center font-mono">
                                        {prob.testcaseStatus === 'ready' ? (
                                            <span className="text-green-400">Đã upload testcase</span>
                                        ) : (
                                            <>
                                                <span className="text-slate-500">Chưa upload testcase</span>
                                                <i className="ph-fill ph-warning-circle text-yellow-500 inline ml-1" title="Chưa có testcase"></i>
                                            </>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center font-mono text-white">
                                        {prob.tags.map((tag) => tag.name).join(', ')}
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2 whitespace-nowrap">
                                        <button
                                            onClick={() => {
                                                setSelectedProblemId(prob.id);
                                                setSelectedProblemTitle(prob.title);
                                                setDiscussionModalOpen(true);
                                            }}
                                            className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors border border-blue-500/20 tooltip"
                                            title="Xem thảo luận"
                                        >
                                            <i className="ph-bold ph-chat-circle-dots"></i>
                                        </button>
                                        <button
                                            onClick={() => navigate('/moderator/testcases', { state: { problemId: prob.id } })}
                                            className="p-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition-colors border border-indigo-500/20 relative tooltip"
                                            title="Chỉnh sửa Tests"
                                        >
                                            <i className="ph-bold ph-flask"></i>
                                            {prob.testcaseStatus === 'not_uploaded' && (
                                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                                                </span>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (currentUser?.role !== 'admin' && currentUser?.id !== prob.authorId) {
                                                    toast.warning('Bạn không phải người tạo bài tập này, không thể cập nhật!');
                                                    return;
                                                }
                                                navigate(`/moderator/problems/edit/${prob.id}`);
                                            }}
                                            className="inline-block p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors border border-blue-500/20 tooltip"
                                            title="Chỉnh sửa Đề"
                                        >
                                            <i className="ph-bold ph-pencil-simple"></i>
                                        </button>
                                        <button
                                            className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/20 tooltip"
                                            title="Xóa"
                                            onClick={() => {
                                                if (currentUser?.role !== 'admin' && currentUser?.id !== prob.authorId) {
                                                    toast.warning('Bạn không phải người tạo bài tập này, không thể xóa!');
                                                    return;
                                                }
                                                setProblemToDelete(prob);
                                                setDeleteModalOpen(true);
                                            }}
                                        >
                                            <i className="ph-bold ph-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {problems.length > itemsPerPage && (
                        <div className="px-6 py-4 border-t border-[#1e293b] flex justify-between items-center bg-slate-900/30">
                            <span className="text-sm text-slate-400">
                                Hiển thị <span className="font-medium text-white">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, problems.length)}</span> trong số <span className="font-medium text-white">{problems.length}</span> bài tập
                            </span>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => paginate(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`px-3 py-1 border border-[#334155] rounded transition text-sm ${currentPage === 1 ? 'bg-[#1e293b]/50 text-slate-600 cursor-not-allowed' : 'bg-[#1e293b] text-slate-400 hover:bg-[#334155]'}`}
                                >
                                    Trang trước
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                                    <button
                                        key={number}
                                        onClick={() => paginate(number)}
                                        className={`px-3 py-1 rounded text-sm font-medium transition ${currentPage === number ? 'bg-blue-600 text-white' : 'border border-[#334155] bg-[#1e293b] text-slate-400 hover:bg-[#334155]'}`}
                                    >
                                        {number}
                                    </button>
                                ))}

                                <button
                                    onClick={() => paginate(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={`px-3 py-1 border border-[#334155] rounded transition text-sm ${currentPage === totalPages ? 'bg-[#1e293b]/50 text-slate-600 cursor-not-allowed' : 'bg-[#1e293b] text-slate-400 hover:bg-[#334155]'}`}
                                >
                                    Trang sau
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>

            <DeleteModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Xác nhận Xóa Bài Tập"
                description={`Bạn có thực sự muốn xóa bài tập "${problemToDelete?.title}"? Hành động này sẽ không thể khôi phục.`}
                isDeleting={isDeleting}
            />
            <DiscussionModal
                isOpen={discussionModalOpen}
                onClose={() => {
                    setDiscussionModalOpen(false);
                    setSelectedProblemId(null);
                    setSelectedProblemTitle(null);
                }}
                problemId={selectedProblemId}
                problemTitle={selectedProblemTitle}
            />
        </ModeratorLayout>
    );
};
