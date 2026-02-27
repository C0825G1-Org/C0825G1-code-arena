import React, { useEffect, useState } from 'react';
import { ModeratorLayout } from '../../layouts/ModeratorLayout';
import axiosClient from '../../../../shared/services/axiosClient';
import {
    CalendarStar,
    Plus,
    PencilSimple,
    Trash,
    ListMagnifyingGlass,
    CircleNotch,
    ChartLineUp,
    ChartPieSlice
} from '@phosphor-icons/react';
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
            <div className="flex flex-col h-full space-y-6 animate-fade-in-up">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <CalendarStar weight="duotone" className="text-purple-400" /> Quản Lý Cuộc Thi
                        </h1>
                        <p className="text-slate-400 mt-1">Quản lý danh sách, thêm mới và tùy chỉnh các cuộc thi.</p>
                    </div>
                    <button
                        onClick={() => setCreateModalOpen(true)}
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-lg shadow-lg shadow-purple-500/20 transition-all font-medium border border-purple-400/30">
                        <Plus weight="bold" /> Thêm Cuộc Thi Mới
                    </button>
                </div>

                {/* Table Container */}
                <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl border border-slate-700/50 flex-1 overflow-hidden flex flex-col">
                    <div className="overflow-x-auto flex-1 h-full">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-900/50 sticky top-0 z-10 backdrop-blur-md shadow-sm">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700/50">ID</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700/50">Tên Cuộc Thi</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700/50">Trạng Thái</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700/50">Thời Gian Bắt Đầu / Kết Thúc</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700/50">Số Người Tham Gia</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700/50 text-right">Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/30">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                            <CircleNotch weight="bold" className="text-3xl animate-spin mx-auto mb-3 text-purple-400" />
                                            Đang tải dữ liệu...
                                        </td>
                                    </tr>
                                ) : contests.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                            Chưa có cuộc thi nào trong hệ thống.
                                        </td>
                                    </tr>
                                ) : (
                                    contests.map((contest) => (
                                        <tr key={contest.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-4 text-slate-400 font-mono text-sm max-w-[80px]">#{contest.id}</td>
                                            <td className="px-6 py-4 font-semibold text-white truncate max-w-[250px]">{contest.title}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 text-xs font-medium rounded border uppercase tracking-wider ${getStatusStyles(contest.status)}`}>
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
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end items-center gap-2">
                                                    {contest.status === 'active' && (
                                                        <button className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded transition-colors flex items-center justify-center tooltip-trigger border border-emerald-500/20" title="Monitor (Theo dõi diễn biến)">
                                                            <ChartLineUp weight="duotone" className="text-lg" />
                                                        </button>
                                                    )}
                                                    {contest.status === 'finished' && (
                                                        <Link
                                                            to={`/moderator/contests/${contest.id}/results`}
                                                            className="p-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded transition-colors flex items-center justify-center tooltip-trigger border border-purple-500/20"
                                                            title="Thống kê kết quả"
                                                        >
                                                            <ChartPieSlice weight="duotone" className="text-lg" />
                                                        </Link>
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            setSelectedContest({ id: contest.id, title: contest.title });
                                                            setManageProblemModalOpen(true);
                                                        }}
                                                        className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded transition-colors flex items-center justify-center tooltip-trigger border border-blue-500/20"
                                                        title="Quản lý bài tập"
                                                    >
                                                        <ListMagnifyingGlass weight="duotone" className="text-lg" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedContest({ id: contest.id, title: contest.title });
                                                            setEditModalOpen(true);
                                                        }}
                                                        className="p-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded transition-colors flex items-center justify-center tooltip-trigger border border-orange-500/20"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <PencilSimple weight="duotone" className="text-lg" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedContest({ id: contest.id, title: contest.title });
                                                            setDeleteModalOpen(true);
                                                        }}
                                                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-colors flex items-center justify-center tooltip-trigger border border-red-500/20"
                                                        title="Xóa cuộc thi"
                                                    >
                                                        <Trash weight="duotone" className="text-lg" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
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
