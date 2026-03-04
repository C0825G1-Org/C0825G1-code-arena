import React, { useState, useEffect } from 'react';
import { X, ListMagnifyingGlass, CheckCircle, PlusCircle, Trash } from '@phosphor-icons/react';
import axiosClient from '../../../../shared/services/axiosClient';
import { toast } from 'react-hot-toast';

interface ManageProblemsModalProps {
    isOpen: boolean;
    onClose: () => void;
    contestId: number | null;
    contestTitle: string;
    onSuccess: () => void;
}

export const ManageProblemsModal = ({ isOpen, onClose, contestId, contestTitle, onSuccess }: ManageProblemsModalProps) => {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);

    // Lists
    const [contestProblems, setContestProblems] = useState<any[]>([]); // Current problems in contest
    const [allProblems, setAllProblems] = useState<any[]>([]);       // All problems moderator can add
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isOpen && contestId) {
            fetchData();
        }
    }, [isOpen, contestId]);

    const fetchData = async () => {
        try {
            setFetching(true);
            // Fetch contest details (to get its problems)
            const contestRes: any = await axiosClient.get(`/contests/${contestId}`);
            setContestProblems(contestRes.problems || []);

            // Fetch all problems (API returns all, we will filter them in JS if needed by ownership, but API should ideally return only what mod can see)
            const problemsRes: any = await axiosClient.get(`/problems?manage=true`);
            setAllProblems(problemsRes || []);
        } catch (error) {
            toast.error('Lỗi tải dữ liệu bài tập');
            onClose();
        } finally {
            setFetching(false);
        }
    };

    const handleAddProblem = async (problemId: number) => {
        try {
            setLoading(true);
            const payload = {
                problems: [
                    {
                        problemId: problemId,
                        orderIndex: contestProblems.length // append to the end
                    }
                ]
            };
            await axiosClient.post(`/contests/${contestId}/problems`, payload);
            toast.success('Đã thêm bài tập vào cuộc thi!');
            fetchData(); // reload
            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Có lỗi khi thêm bài tập.');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveProblem = async (problemId: number) => {
        try {
            setLoading(true);
            await axiosClient.delete(`/contests/${contestId}/problems/${problemId}`);
            toast.success('Đã xóa bài tập khỏi cuộc thi.');
            fetchData(); // reload
            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Có lỗi khi xóa bài tập.');
        } finally {
            setLoading(false);
        }
    };

    // Filter available problems to those not already in the contest, matching search query, and HAVING AT LEAST 1 TESTCASE ('ready')
    const availableProblems = allProblems
        .filter(p => p.testcaseStatus === 'ready')
        .filter(p => !contestProblems.some(cp => cp.id === p.id))
        .filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.toString() === searchQuery);

    if (!isOpen || !contestId) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-5 border-b border-slate-700/50 bg-slate-800/80">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <ListMagnifyingGlass weight="duotone" className="text-blue-400" />
                            Quản Lý Bộ Đề
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">Cuộc thi: <span className="text-white font-medium">{contestTitle}</span></p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-700/50 hover:bg-slate-600/50 p-1.5 rounded-lg">
                        <X weight="bold" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {fetching ? (
                        <div className="col-span-2 text-center text-slate-400 py-10">Đang tải dữ liệu...</div>
                    ) : (
                        <>
                            {/* Cột 1: Danh sách bài tập ĐÃ CÓ trong Contest */}
                            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                                <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                                    <CheckCircle weight="fill" className="text-emerald-500" />
                                    Bài tập trong cuộc thi ({contestProblems.length})
                                </h4>
                                <div className="space-y-3">
                                    {contestProblems.length === 0 ? (
                                        <p className="text-sm text-slate-500 text-center py-4">Chưa có bài tập nào.</p>
                                    ) : (
                                        contestProblems.map((cp, idx) => (
                                            <div key={cp.id} className="bg-slate-800 border border-slate-700 rounded-lg p-3 flex justify-between items-center group
                                                hover:border-slate-600 transition-colors">
                                                <div>
                                                    <span className="text-xs text-slate-500 font-mono block">#{cp.id} - Thứ tự: {cp.orderIndex}</span>
                                                    <span className="text-sm text-white font-medium">{cp.title}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveProblem(cp.id)}
                                                    disabled={loading || contestProblems.length <= 1}
                                                    className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title={contestProblems.length <= 1 ? "Không thể xóa bài tập cuối cùng" : "Xóa khỏi cuộc thi"}
                                                >
                                                    <Trash weight="bold" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Cột 2: Tìm kiếm và Thêm bài tập mới */}
                            <div className="bg-slate-900/30 rounded-xl p-4 border border-slate-700/30 flex flex-col">
                                <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                                    <ListMagnifyingGlass weight="duotone" className="text-blue-400" />
                                    Kho bài tập của bạn
                                </h4>
                                <div className="mb-4">
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm ID hoặc tên bài tập..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>
                                <div className="space-y-3 overflow-y-auto flex-1 max-h-[50vh] pr-2 custom-scrollbar">
                                    {availableProblems.length === 0 ? (
                                        <p className="text-sm text-slate-500 text-center py-4">Không tìm thấy bài tập phù hợp hoặc bạn chưa tạo bài tập nào.</p>
                                    ) : (
                                        availableProblems.map(p => (
                                            <div key={p.id} className="bg-slate-800/80 border border-slate-700/50 rounded-lg p-3 flex justify-between items-center group
                                                hover:bg-slate-800 hover:border-blue-500/30 transition-all">
                                                <div>
                                                    <span className="text-xs text-blue-400/80 font-mono block">#{p.id}</span>
                                                    <span className="text-sm text-slate-200 font-medium line-clamp-1">{p.title}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleAddProblem(p.id)}
                                                    disabled={loading}
                                                    className="p-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded transition-colors"
                                                    title="Thêm vào cuộc thi"
                                                >
                                                    <PlusCircle weight="bold" className="text-lg" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
