import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ModeratorLayout } from '../../components/ModeratorLayout';
import axiosClient from '../../../../shared/services/axiosClient';
import { Link } from 'react-router-dom';
import { DeleteContestModal } from '../components/DeleteContestModal';
import { EditContestModal } from '../components/EditContestModal';
import { ManageProblemsModal } from '../components/ManageProblemsModal';
import { CreateContestModal } from '../components/CreateContestModal';
import { useContestWebSocket } from '../../../../features/user/contests/hooks/useContestWebSocket';

interface Contest {
    id: number;
    title: string;
    status: string;
    startTime: string;
    endTime: string;
    participantCount: number;
    maxParticipants: number;
}

export const ContestManagementPage = () => {
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
                size: 5,
                page: page,
                sort: 'startTime,desc',
                manage: true
            };

            if (searchTerm) params.title = searchTerm;
            if (statusFilter) params.status = statusFilter;

            // Append time range if provided (format should be ISO-compatible or matched to backend DateTimeFormat)
            if (startTime) {
                params.startTime = new Date(startTime).toISOString();
            }
            if (endTime) {
                // To include the whole day, set to 23:59:59 if it's just a date
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

    // Keep latest fetchContests for websocket callbacks (avoid stale closure).
    const fetchContestsRef = useRef(fetchContests);
    useEffect(() => {
        fetchContestsRef.current = fetchContests;
    }, [fetchContests]);

    useEffect(() => {
        fetchContests();
    }, [fetchContests]); // Re-fetch when params (incl. page) change

    // WebSocket real-time updates for contest status
    const handleContestStatusUpdate = useCallback((_wsContestId: number, _newStatus: string) => {
        // Refetch to ensure status badges update without full page reload.
        fetchContestsRef.current();
    }, []);

    useContestWebSocket(handleContestStatusUpdate);

    const handleSearchClick = () => {
        if (page === 0) {
            fetchContests();
        } else {
            setPage(0); // This will trigger useEffect to fetch
        }
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
        setStartTime('');
        setEndTime('');
        if (page === 0) {
            // Need a slight delay to allow state updates to queue, or just let the user click search after reset, 
            // but better to fetch immediately. Because state updates are async, 
            // the safest way is to fetch after states are cleared, but since fetch reads from state, 
            // it's tricky without a useEffect dependency. 
            // Let's just reset the states, and the user can see them clear, then we trigger a fetch 
            // using the empty values directly to bypass the async state delay.
            fetchWithEmptyFilters();
        } else {
            setPage(0); // This will trigger useEffect, but might race with state updates.
        }
    };

    const fetchWithEmptyFilters = async () => {
        try {
            setLoading(true);
            const params: any = { size: 5, page: 0, sort: 'startTime,desc', manage: true };
            const response: any = await axiosClient.get('/contests', { params });
            setContests(response.content || []);
            setTotalPages(response.totalPages || 0);
            setTotalElements(response.totalElements || 0);
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
                    className={`w-8 h-8 mx-0.5 flex items-center justify-center rounded text-sm transition-colors ${page === i ? 'bg-blue-600 text-white font-medium shadow-sm shadow-blue-500/20' : 'bg-transparent text-slate-400 hover:bg-[#1e293b] hover:text-white'}`}
                >
                    {i + 1}
                </button>
            );
        }
        return pages;
    };

    return (
        <ModeratorLayout>
            <div className="flex-1 overflow-y-auto p-6 bg-[#0f172a] animate-fade-in-up">
                {/* Header */}
                <div className="mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                            <i className="ph-duotone ph-calendar-star text-purple-400 text-3xl"></i> Quản lý cuộc thi
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">Quản lý danh sách, thêm mới và tùy chỉnh các cuộc thi.</p>
                    </div>
                </div>

                {/* Filters container matching Minh's ListPage */}
                <div className="flex justify-between items-center mb-6 gap-4">
                    {/* Search & Filter */}
                    <div className="flex gap-4 items-center flex-wrap flex-1">
                        <div className="relative w-64">
                            <i className="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                            <input
                                type="text"
                                placeholder="Tìm theo tên cuộc thi..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-[#1e293b] border border-[#334155] text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block pl-10 p-2.5 outline-none transition-all"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-[#1e293b] border border-[#334155] text-slate-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="UPCOMING">Sắp diễn ra</option>
                            <option value="ACTIVE">Đang diễn ra</option>
                            <option value="FINISHED">Đã kết thúc</option>
                            <option value="CANCELLED">Đã hủy</option>
                        </select>
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="bg-[#1e293b] border border-[#334155] text-slate-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
                                title="Thời gian bắt đầu (từ)"
                            />
                            <span className="text-slate-500">-</span>
                            <input
                                type="date"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="bg-[#1e293b] border border-[#334155] text-slate-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
                                title="Thời gian kết thúc (đến)"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleResetFilters}
                                className="bg-[#1e293b] hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2 border border-[#334155]"
                                title="Làm mới bộ lọc"
                            >
                                <i className="ph-bold ph-arrows-clockwise"></i> Làm mới
                            </button>
                            <button
                                onClick={handleSearchClick}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2 shadow-lg shadow-blue-500/20"
                            >
                                <i className="ph-bold ph-magnifying-glass"></i> Tìm kiếm
                            </button>
                        </div>
                    </div>
                    {/* The Add button moved to the same row as filters */}
                    <button
                        onClick={() => setCreateModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2 shadow-lg shadow-blue-500/20 whitespace-nowrap"
                    >
                        <i className="ph-bold ph-plus"></i> Thêm Cuộc Thi Mới
                    </button>
                </div>

                {/* Table Container */}
                <div className="bg-[#1e293b]/70 backdrop-blur-md rounded-xl overflow-hidden border border-slate-700/50 shadow-xl shadow-black/20">
                    <table className="w-full text-sm text-left text-slate-400">
                        <thead className="text-xs uppercase bg-[#1e293b] text-slate-300">
                            <tr>
                                <th className="px-6 py-3.5 font-semibold">ID</th>
                                <th className="px-6 py-3.5 font-semibold">Tên Cuộc Thi</th>
                                <th className="px-6 py-3.5 font-semibold">Trạng Thái</th>
                                <th className="px-6 py-3.5 font-semibold">Thời Gian</th>
                                <th className="px-6 py-3.5 font-semibold">Tham Gia</th>
                                <th className="px-6 py-3.5 font-semibold text-right">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-6 text-slate-400">
                                        <i className="ph-bold ph-circle-notch text-3xl animate-spin mx-auto mb-3 text-purple-400 block"></i>
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : contests.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-6 text-slate-400">Chưa có cuộc thi nào trong hệ thống.</td>
                                </tr>
                            ) : (
                                contests.map((contest) => (
                                    <tr key={contest.id} className="border-b border-[#1e293b] hover:bg-[#1e293b]/50 transition-colors">
                                        <td className="px-6 py-3 font-mono">#{contest.id}</td>
                                        <td className="px-6 py-3 font-medium text-white">{contest.title}</td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded border ${getStatusStyles(contest.status)}`}>
                                                {getStatusText(contest.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-xs text-slate-300">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-emerald-400/90 whitespace-nowrap">{formatDate(contest.startTime)}</span>
                                                <span className="text-red-400/90 whitespace-nowrap">{formatDate(contest.endTime)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-slate-300 font-mono">
                                            {contest.participantCount} / {contest.maxParticipants} <span className="text-slate-500 font-sans text-xs">thí sinh</span>
                                        </td>
                                        <td className="px-6 py-3 text-right space-x-1 whitespace-nowrap">
                                            {contest.status === 'active' && (
                                                <button className="p-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors border border-emerald-500/20 tooltip" title="Monitor (Theo dõi diễn biến)">
                                                    <i className="ph-duotone ph-chart-line-up text-base"></i>
                                                </button>
                                            )}
                                            {contest.status === 'finished' && (
                                                <Link
                                                    to={`/moderator/contests/${contest.id}/results`}
                                                    className="inline-block p-1.5 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 rounded-lg transition-colors border border-purple-500/20 tooltip"
                                                    title="Thống kê kết quả"
                                                >
                                                    <i className="ph-duotone ph-chart-pie-slice text-base"></i>
                                                </Link>
                                            )}
                                            <button
                                                onClick={() => {
                                                    setSelectedContest({ id: contest.id, title: contest.title });
                                                    setManageProblemModalOpen(true);
                                                }}
                                                className="inline-block p-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition-colors border border-indigo-500/20 tooltip"
                                                title="Quản lý bài tập"
                                            >
                                                <i className="ph-duotone ph-list-magnifying-glass text-base"></i>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedContest({ id: contest.id, title: contest.title });
                                                    setEditModalOpen(true);
                                                }}
                                                className="inline-block p-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors border border-blue-500/20 tooltip"
                                                title="Chỉnh sửa"
                                            >
                                                <i className="ph-bold ph-pencil-simple text-base"></i>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedContest({ id: contest.id, title: contest.title });
                                                    setDeleteModalOpen(true);
                                                }}
                                                className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/20 tooltip"
                                                title="Xóa cuộc thi"
                                            >
                                                <i className="ph-bold ph-trash text-base"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {totalPages > 0 && (
                        <div className="px-6 py-4 border-t border-slate-700/50 bg-[#1e293b]/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <span className="text-sm text-slate-400">
                                Hiển thị <span className="font-semibold text-white">{contests.length}</span> trong số <span className="font-semibold text-white">{totalElements}</span> cuộc thi
                            </span>

                            {totalPages > 1 && (
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setPage(p => Math.max(0, p - 1))}
                                        disabled={page === 0}
                                        className={`px-3 py-1.5 text-sm rounded transition-colors flex items-center gap-1 ${page === 0 ? 'text-slate-500 cursor-not-allowed' : 'text-slate-400 hover:bg-[#1e293b] hover:text-white'}`}
                                    >
                                        <i className="ph-bold ph-caret-left"></i> Trang trước
                                    </button>

                                    <div className="flex items-center mx-2">
                                        {renderPageNumbers()}
                                    </div>

                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                        disabled={page >= totalPages - 1}
                                        className={`px-3 py-1.5 text-sm rounded transition-colors flex items-center gap-1 ${page >= totalPages - 1 ? 'text-slate-500 cursor-not-allowed' : 'text-slate-400 hover:bg-[#1e293b] hover:text-white'}`}
                                    >
                                        Trang sau <i className="ph-bold ph-caret-right"></i>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
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
