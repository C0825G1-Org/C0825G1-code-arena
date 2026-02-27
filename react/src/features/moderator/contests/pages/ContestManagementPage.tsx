import React, { useEffect, useState } from 'react';
import { ModeratorLayout } from '../../components/ModeratorLayout';
import axiosClient from '../../../../shared/services/axiosClient';
import { Link } from 'react-router-dom';
import { DeleteContestModal } from '../components/DeleteContestModal';
import { EditContestModal } from '../components/EditContestModal';
import { ManageProblemsModal } from '../components/ManageProblemsModal';
import { CreateContestModal } from '../components/CreateContestModal';

interface Contest {
    id: number;
    title: string;
    status: string;
    startTime: string;
    endTime: string;
    participantCount: number;
}

export const ContestManagementPage = () => {
    const [contests, setContests] = useState<Contest[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [manageProblemModalOpen, setManageProblemModalOpen] = useState(false);
    const [selectedContest, setSelectedContest] = useState<{ id: number; title: string } | null>(null);

    useEffect(() => {
        fetchContests();
    }, []);

    const fetchContests = async () => {
        try {
            setLoading(true);
            const response: any = await axiosClient.get('/contests', { params: { size: 50, sort: 'id,desc', manage: true } });
            setContests(response.content || []);
        } catch (error) {
            console.error('Failed to load contests', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        }).format(date);
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-500/10 text-green-400 border-green-500/20';
            case 'upcoming': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            case 'finished': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
            case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    return (
        <ModeratorLayout>
            <div className="flex-1 overflow-y-auto p-8 bg-[#0f172a] animate-fade-in-up">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                            <i className="ph-duotone ph-calendar-star text-purple-400 text-3xl"></i> Quản Lý Cuộc Thi
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">Quản lý danh sách, thêm mới và tùy chỉnh các cuộc thi.</p>
                    </div>
                    <button
                        onClick={() => setCreateModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2 shadow-lg shadow-blue-500/20"
                    >
                        <i className="ph-bold ph-plus"></i> Thêm Cuộc Thi Mới
                    </button>
                </div>

                {/* Table Container */}
                <div className="bg-[#1e293b]/70 backdrop-blur-md rounded-xl overflow-hidden border border-slate-700/50">
                    <table className="w-full text-sm text-left text-slate-400">
                        <thead className="text-xs uppercase bg-[#1e293b] text-slate-300">
                            <tr>
                                <th className="px-6 py-4 font-semibold">ID</th>
                                <th className="px-6 py-4 font-semibold">Tên Cuộc Thi</th>
                                <th className="px-6 py-4 font-semibold">Trạng Thái</th>
                                <th className="px-6 py-4 font-semibold">Thời Gian Bắt Đầu / Kết Thúc</th>
                                <th className="px-6 py-4 font-semibold">Số Người Tham Gia</th>
                                <th className="px-6 py-4 font-semibold text-right">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-slate-400">
                                        <i className="ph-bold ph-circle-notch text-3xl animate-spin mx-auto mb-3 text-purple-400 block"></i>
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : contests.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-slate-400">Chưa có cuộc thi nào trong hệ thống.</td>
                                </tr>
                            ) : (
                                contests.map((contest) => (
                                    <tr key={contest.id} className="border-b border-[#1e293b] hover:bg-[#1e293b]/50 transition-colors">
                                        <td className="px-6 py-4 font-mono">#{contest.id}</td>
                                        <td className="px-6 py-4 font-medium text-white">{contest.title}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded border ${getStatusStyles(contest.status)}`}>
                                                {contest.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-300">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-emerald-400/90">{formatDate(contest.startTime)}</span>
                                                <span className="text-red-400/90">{formatDate(contest.endTime)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-300 font-mono">
                                            {contest.participantCount} <span className="text-slate-500 font-sans text-sm">thí sinh</span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            {contest.status === 'active' && (
                                                <button className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors border border-emerald-500/20 tooltip" title="Monitor (Theo dõi diễn biến)">
                                                    <i className="ph-duotone ph-chart-line-up"></i>
                                                </button>
                                            )}
                                            {contest.status === 'finished' && (
                                                <Link
                                                    to={`/moderator/contests/${contest.id}/results`}
                                                    className="inline-block p-2 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 rounded-lg transition-colors border border-purple-500/20 tooltip"
                                                    title="Thống kê kết quả"
                                                >
                                                    <i className="ph-duotone ph-chart-pie-slice"></i>
                                                </Link>
                                            )}
                                            <button
                                                onClick={() => {
                                                    setSelectedContest({ id: contest.id, title: contest.title });
                                                    setManageProblemModalOpen(true);
                                                }}
                                                className="inline-block p-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition-colors border border-indigo-500/20 tooltip"
                                                title="Quản lý bài tập"
                                            >
                                                <i className="ph-duotone ph-list-magnifying-glass"></i>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedContest({ id: contest.id, title: contest.title });
                                                    setEditModalOpen(true);
                                                }}
                                                className="inline-block p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors border border-blue-500/20 tooltip"
                                                title="Chỉnh sửa"
                                            >
                                                <i className="ph-bold ph-pencil-simple"></i>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedContest({ id: contest.id, title: contest.title });
                                                    setDeleteModalOpen(true);
                                                }}
                                                className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/20 tooltip"
                                                title="Xóa cuộc thi"
                                            >
                                                <i className="ph-bold ph-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            <CreateContestModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onSuccess={fetchContests}
            />
            <DeleteContestModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                contestId={selectedContest?.id || null}
                contestTitle={selectedContest?.title || ''}
                onSuccess={fetchContests}
            />
            <EditContestModal
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                contestId={selectedContest?.id || null}
                onSuccess={fetchContests}
            />
            <ManageProblemsModal
                isOpen={manageProblemModalOpen}
                onClose={() => setManageProblemModalOpen(false)}
                contestId={selectedContest?.id || null}
                contestTitle={selectedContest?.title || ''}
                onSuccess={fetchContests}
            />
        </ModeratorLayout>
    );
};
