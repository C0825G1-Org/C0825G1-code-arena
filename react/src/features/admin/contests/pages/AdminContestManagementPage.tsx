import React, { useEffect, useState, useCallback, useRef } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import axiosClient from '../../../../shared/services/axiosClient';
import { Link } from 'react-router-dom';
import { DeleteContestModal } from '../../../moderator/contests/components/DeleteContestModal';
import { EditContestModal } from '../../../moderator/contests/components/EditContestModal';
import { ManageProblemsModal } from '../../../moderator/contests/components/ManageProblemsModal';
import { CreateContestModal } from '../../../moderator/contests/components/CreateContestModal';
import { useContestWebSocket } from '../../../../features/user/contests/hooks/useContestWebSocket';
import { Trophy, CalendarPlus, MagnifyingGlass, ArrowsClockwise, PencilSimple, Trash, ChartLineUp, ChartPieSlice, ListMagnifyingGlass, CircleNotch, CaretLeft, CaretRight, User } from '@phosphor-icons/react';

interface Contest {
    id: number;
    title: string;
    status: string;
    startTime: string;
    endTime: string;
    participantCount: number;
    maxParticipants: number;
    creatorName: string;
    creatorUsername: string;
}

export const AdminContestManagementPage = () => {
    const [contests, setContests] = useState<Contest[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    // Pagination States
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // Modal States
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [manageProblemModalOpen, setManageProblemModalOpen] = useState(false);
    const [selectedContest, setSelectedContest] = useState<{ id: number; title: string } | null>(null);

    const fetchContests = useCallback(async () => {
        try {
            setLoading(true);
            const params: any = {
                size: 8,
                page: page,
                sort: 'startTime,desc',
                manage: true // Admin management view
            };

            if (searchTerm) params.title = searchTerm;
            if (statusFilter) params.status = statusFilter;

            if (startTime) {
                params.startTime = new Date(startTime).toISOString();
            }
            if (endTime) {
                const end = new Date(endTime);
                end.setHours(23, 59, 59, 999);
                params.endTime = end.toISOString();
            }

            const response: any = await axiosClient.get('/contests', { params });
            setContests(response.content || []);
            setTotalPages(response.totalPages || 0);
            setTotalElements(response.totalElements || 0);
        } catch (error) {
            console.error('Failed to load contests', error);
        } finally {
            setLoading(false);
        }
    }, [page, searchTerm, statusFilter, startTime, endTime]);

    const fetchContestsRef = useRef(fetchContests);
    useEffect(() => {
        fetchContestsRef.current = fetchContests;
    }, [fetchContests]);

    useEffect(() => {
        fetchContests();
    }, [fetchContests]);

    const handleContestStatusUpdate = useCallback((_wsContestId: number, _newStatus: string) => {
        fetchContestsRef.current();
    }, []);

    useContestWebSocket(handleContestStatusUpdate);

    const handleSearchClick = () => {
        if (page === 0) {
            fetchContests();
        } else {
            setPage(0);
        }
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
        setStartTime('');
        setEndTime('');
        if (page === 0) {
            fetchContests();
        } else {
            setPage(0);
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
        switch (status?.toLowerCase()) {
            case 'active': return 'bg-green-500/10 text-green-400 border-green-500/20';
            case 'upcoming': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            case 'finished': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
            case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    const getStatusText = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'active': return 'Đang diễn ra';
            case 'upcoming': return 'Sắp diễn ra';
            case 'finished': return 'Đã kết thúc';
            case 'cancelled': return 'Đã hủy';
            default: return status;
        }
    };

    const renderPageNumbers = () => {
        const pages = [];
        for (let i = 0; i < totalPages; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`w-8 h-8 mx-0.5 flex items-center justify-center rounded text-sm transition-colors ${page === i ? 'bg-red-600 text-white font-medium shadow-sm shadow-red-500/20' : 'bg-transparent text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                    {i + 1}
                </button>
            );
        }
        return pages;
    };

    return (
        <AdminLayout title="Quản lý Cuộc thi" activeTab="contests">
            <div className="animate-fade-in-up space-y-6">
                {/* Header Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/40 p-5 rounded-xl border border-slate-700/50">
                    <div className="flex flex-wrap gap-3 items-center flex-1">
                        <div className="relative w-full md:w-64">
                            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm theo tên cuộc thi..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block pl-10 p-2.5 outline-none transition-all"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-slate-950 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block p-2.5 outline-none"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="UPCOMING">Sắp diễn ra</option>
                            <option value="ACTIVE">Đang diễn ra</option>
                            <option value="FINISHED">Đã kết thúc</option>
                        </select>
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="bg-slate-950 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block p-2.5 outline-none"
                                title="Từ ngày"
                            />
                            <span className="text-slate-600">-</span>
                            <input
                                type="date"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="bg-slate-950 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block p-2.5 outline-none"
                                title="Đến ngày"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleResetFilters}
                                className="bg-slate-950 hover:bg-slate-800 text-slate-300 px-4 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2 border border-slate-700"
                            >
                                <ArrowsClockwise size={18} /> Reset
                            </button>
                            <button
                                onClick={handleSearchClick}
                                className="bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2 shadow-lg shadow-red-500/20"
                            >
                                <MagnifyingGlass size={18} weight="bold" /> Tìm kiếm
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={() => setCreateModalOpen(true)}
                        className="bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2 shadow-lg shadow-red-500/20 whitespace-nowrap"
                    >
                        <CalendarPlus size={20} weight="bold" /> Thêm Cuộc Thi
                    </button>
                </div>

                {/* Table */}
                <div className="bg-slate-950/50 backdrop-blur-md rounded-xl overflow-hidden border border-slate-800 shadow-xl">
                    <table className="w-full text-sm text-left text-slate-400">
                        <thead className="text-xs uppercase bg-slate-900/50 text-slate-300 border-b border-slate-800">
                            <tr>
                                <th className="px-6 py-4 font-semibold w-16">ID</th>
                                <th className="px-6 py-4 font-semibold">Cuộc thi</th>
                                <th className="px-6 py-4 font-semibold">Moderator</th>
                                <th className="px-6 py-4 font-semibold">Trạng thái</th>
                                <th className="px-6 py-4 font-semibold">Thời gian</th>
                                <th className="px-6 py-4 font-semibold">Tham gia</th>
                                <th className="px-6 py-4 font-semibold text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-slate-500">
                                        <CircleNotch className="w-8 h-8 animate-spin mx-auto mb-4 text-red-500" />
                                        Đang tải danh sách cuộc thi...
                                    </td>
                                </tr>
                            ) : contests.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-slate-500">
                                        <Trophy className="w-12 h-12 mx-auto mb-4 opacity-10" />
                                        Không tìm thấy cuộc thi nào.
                                    </td>
                                </tr>
                            ) : (
                                contests.map((contest) => (
                                    <tr key={contest.id} className="hover:bg-slate-800/30 transition-colors group">
                                        <td className="px-6 py-4 font-mono text-slate-500">#{contest.id}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-white group-hover:text-red-400 transition-colors">{contest.title}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 border border-slate-700">
                                                    {contest.creatorUsername?.substring(0, 2).toUpperCase() || '??'}
                                                </div>
                                                <div>
                                                    <div className="text-slate-200 font-medium text-xs">{contest.creatorName || 'N/A'}</div>
                                                    <div className="text-slate-500 text-[10px] font-mono">@{contest.creatorUsername || 'unknown'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${getStatusStyles(contest.status)}`}>
                                                {getStatusText(contest.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono">
                                            <div className="text-emerald-400">{formatDate(contest.startTime)}</div>
                                            <div className="text-slate-500">{formatDate(contest.endTime)}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-red-600 rounded-full"
                                                        style={{ width: `${Math.min(100, (contest.participantCount / contest.maxParticipants) * 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-slate-300 font-mono">{contest.participantCount}/{contest.maxParticipants}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {(contest.status?.toLowerCase() === 'active' || contest.status?.toLowerCase() === 'upcoming') && (
                                                    <Link
                                                        to={`/moderator/contests/${contest.id}/monitor`}
                                                        className={`p-1.5 rounded-lg transition-colors border ${
                                                            contest.status?.toLowerCase() === 'active' 
                                                            ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20' 
                                                            : 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border-purple-500/20'
                                                        }`}
                                                        title={contest.status?.toLowerCase() === 'active' ? "Theo dõi diễn biến" : "Phòng chờ & Giám sát"}
                                                    >
                                                        <ChartLineUp size={16} weight="duotone" />
                                                    </Link>
                                                )}
                                                {contest.status?.toLowerCase() === 'finished' && (
                                                    <Link
                                                        to={`/moderator/contests/${contest.id}/results`}
                                                        className="p-1.5 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 rounded-lg transition-colors border border-purple-500/20"
                                                        title="Kết quả"
                                                    >
                                                        <ChartPieSlice size={16} weight="duotone" />
                                                    </Link>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        setSelectedContest({ id: contest.id, title: contest.title });
                                                        setManageProblemModalOpen(true);
                                                    }}
                                                    className="p-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition-colors border border-indigo-500/20"
                                                    title="Quản lý bài tập"
                                                >
                                                    <ListMagnifyingGlass size={16} weight="duotone" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedContest({ id: contest.id, title: contest.title });
                                                        setEditModalOpen(true);
                                                    }}
                                                    className="p-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors border border-blue-500/20"
                                                    title="Sửa"
                                                >
                                                    <PencilSimple size={16} weight="bold" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedContest({ id: contest.id, title: contest.title });
                                                        setDeleteModalOpen(true);
                                                    }}
                                                    className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/20"
                                                    title="Xóa"
                                                >
                                                    <Trash size={16} weight="bold" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {totalPages > 0 && (
                        <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-800 flex items-center justify-between">
                            <span className="text-xs text-slate-500">
                                Hiển thị <span className="text-white font-medium">{contests.length}</span> / <span className="text-white font-medium">{totalElements}</span> cuộc thi
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    disabled={page === 0 || loading}
                                    className="p-2 border border-slate-700 rounded-lg text-slate-400 hover:bg-slate-800 disabled:opacity-30 transition-colors"
                                >
                                    <CaretLeft size={16} weight="bold" />
                                </button>
                                <div className="flex items-center mx-1">
                                    {renderPageNumbers()}
                                </div>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                    disabled={page >= totalPages - 1 || loading}
                                    className="p-2 border border-slate-700 rounded-lg text-slate-400 hover:bg-slate-800 disabled:opacity-30 transition-colors"
                                >
                                    <CaretRight size={16} weight="bold" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Reuse Moderator Modals */}
            <CreateContestModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onSuccess={fetchContests}
            />
            {selectedContest && (
                <>
                    <DeleteContestModal
                        isOpen={deleteModalOpen}
                        onClose={() => setDeleteModalOpen(false)}
                        contestId={selectedContest.id}
                        contestTitle={selectedContest.title}
                        onSuccess={fetchContests}
                    />
                    <EditContestModal
                        isOpen={editModalOpen}
                        onClose={() => setEditModalOpen(false)}
                        contestId={selectedContest.id}
                        onSuccess={fetchContests}
                    />
                    <ManageProblemsModal
                        isOpen={manageProblemModalOpen}
                        onClose={() => setManageProblemModalOpen(false)}
                        contestId={selectedContest.id}
                        contestTitle={selectedContest.title}
                        onSuccess={fetchContests}
                    />
                </>
            )}
        </AdminLayout>
    );
};
