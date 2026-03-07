import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    MagnifyingGlass,
    CaretLeft, CaretRight, FunnelSimple, SpinnerGap,
    UserSwitch, LockKey, LockKeyOpen, Trash, WarningCircle
} from '@phosphor-icons/react';
import { adminUserApi, AdminUserDTO } from '../services/adminUserApi';
import { ConfirmRoleModal, TargetRole } from '../components/ConfirmRoleModal';
import { ConfirmLockModal } from '../components/ConfirmLockModal';
import { ConfirmDeleteUserModal } from '../components/ConfirmDeleteUserModal';
import { AdminLayout } from '../../components/AdminLayout';

// ─── Types ───────────────────────────────────────────────────────────────────

type UserRole = 'admin' | 'moderator' | 'user';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_STYLE: Record<UserRole, { badge: string; dot: string; label: string }> = {
    admin:     { badge: 'bg-red-500/10 text-red-400 border border-red-500/20',          dot: 'border-red-500',    label: 'ADMIN' },
    moderator: { badge: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20', dot: 'border-indigo-500', label: 'MODERATOR' },
    user:      { badge: 'bg-slate-700 text-slate-300 border border-slate-600',          dot: 'border-slate-500',  label: 'USER' },
};

const PAGE_SIZE = 10;

// ─── Main Component ───────────────────────────────────────────────────────────

export const AdminUserListPage: React.FC = () => {

    // ── State
    const [users, setUsers]           = useState<AdminUserDTO[]>([]);
    const [totalElements, setTotal]   = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading]       = useState(false);
    const [error, setError]           = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    // ── Modal state — Role
    const [modalTarget, setModalTarget]   = useState<AdminUserDTO | null>(null);
    const [pendingRole, setPendingRole]   = useState<'moderator' | 'user'>('user');
    const [modalLoading, setModalLoading] = useState(false);

    // ── Modal state — Lock
    const [lockModalTarget, setLockModalTarget]   = useState<AdminUserDTO | null>(null);
    const [lockModalLoading, setLockModalLoading] = useState(false);

    // ── Modal state — Delete
    const [deleteModalTarget, setDeleteModalTarget] = useState<AdminUserDTO | null>(null);
    const [deleteModalType, setDeleteModalType] = useState<'soft' | 'hard'>('soft');
    const [deleteModalLoading, setDeleteModalLoading] = useState(false);

    const [search, setSearch]         = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(0); // 0-indexed for Spring

    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Fetch
    const fetchUsers = useCallback(async (s: string, r: string, p: number) => {
        setLoading(true);
        setError(null);
        try {
            const res = await adminUserApi.getUsers(s, r, p, PAGE_SIZE);
            setUsers(res.content);
            setTotal(res.totalElements);
            setTotalPages(res.totalPages);
        } catch {
            setError('Không thể tải danh sách user. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers(search, roleFilter, currentPage);
    }, [roleFilter, currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

    // Debounce search input
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearch(val);
        setCurrentPage(0);
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = setTimeout(() => {
            fetchUsers(val, roleFilter, 0);
        }, 400);
    };

    const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setRoleFilter(e.target.value);
        setCurrentPage(0);
    };

    // ── Open modal
    const openRoleModal = (u: AdminUserDTO) => {
        // Pre-select the opposite role
        setPendingRole(u.role === 'moderator' ? 'user' : 'moderator');
        setModalTarget(u);
    };

    // ── Confirm role change from modal
    const handleConfirmRole = async () => {
        if (!modalTarget) return;
        setModalLoading(true);
        try {
            if (pendingRole === 'moderator') {
                await adminUserApi.promote(modalTarget.id);
            } else {
                await adminUserApi.demote(modalTarget.id);
            }
            setModalTarget(null);
            await fetchUsers(search, roleFilter, currentPage);
        } catch {
            alert('Không thể đổi quyền. Vui lòng thử lại.');
        } finally {
            setModalLoading(false);
        }
    };

    const handleToggleLock = async (u: AdminUserDTO) => {
        setLockModalTarget(u);
    };

    const handleConfirmLock = async () => {
        if (!lockModalTarget) return;
        setLockModalLoading(true);
        try {
            await adminUserApi.toggleLock(lockModalTarget.id);
            setLockModalTarget(null);
            await fetchUsers(search, roleFilter, currentPage);
        } catch {
            alert('Không thể thay đổi trạng thái khoá. Vui lòng thử lại.');
        } finally {
            setLockModalLoading(false);
        }
    };

    // ── Delete modal
    const openDeleteModal = (u: AdminUserDTO, type: 'soft' | 'hard') => {
        setDeleteModalTarget(u);
        setDeleteModalType(type);
    };

    const handleConfirmDelete = async () => {
        if (!deleteModalTarget) return;
        setDeleteModalLoading(true);
        try {
            if (deleteModalType === 'soft') {
                await adminUserApi.softDelete(deleteModalTarget.id);
            } else {
                await adminUserApi.hardDelete(deleteModalTarget.id);
            }
            setDeleteModalTarget(null);
            await fetchUsers(search, roleFilter, currentPage);
        } catch {
            alert('Không thể chuyển đổi trạng thái xóa cho user. Vui lòng thử lại.');
        } finally {
            setDeleteModalLoading(false);
        }
    };

    // ── Pagination display (1-indexed)
    const displayPage = currentPage + 1;

    return (
        <>
        <AdminLayout title="Quản trị Thành Viên" activeTab="users">
                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Search */}
                            <div className="relative w-72">
                                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                                <input
                                    type="text"
                                    placeholder="Tìm tên, email..."
                                    value={search}
                                    onChange={handleSearchChange}
                                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg focus:ring-1 focus:ring-red-500 focus:border-red-500 block pl-10 pr-4 py-2.5 outline-none transition-all placeholder:text-slate-500"
                                />
                            </div>

                            {/* Role filter */}
                            <div className="relative">
                                <FunnelSimple className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none" />
                                <select
                                    value={roleFilter}
                                    onChange={handleRoleChange}
                                    className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-1 focus:ring-red-500 focus:border-red-500 block pl-9 pr-4 py-2.5 outline-none appearance-none"
                                >
                                    <option value="">Tất cả quyền hạn</option>
                                    <option value="admin">Admin</option>
                                    <option value="moderator">Moderator</option>
                                    <option value="user">User</option>
                                </select>
                            </div>
                        </div>

                        <span className="text-sm text-slate-500 font-mono">
                            {loading ? 'Đang tải...' : `${totalElements} user${totalElements !== 1 ? 's' : ''} tìm thấy`}
                        </span>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Table */}
                    <div className="bg-slate-800/50 rounded-xl overflow-x-auto border border-slate-700">
                        <table className="w-full text-sm text-left text-slate-400">
                            <thead className="text-xs uppercase bg-slate-800 text-slate-300">
                                <tr>
                                    <th className="px-4 py-3 font-semibold truncate max-w-[150px]">Thành viên</th>
                                    <th className="px-4 py-3 font-semibold">Tài khoản</th>
                                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Quyền hạn</th>
                                    <th className="px-4 py-3 font-semibold text-center whitespace-nowrap hidden xl:table-cell">Ngày đăng ký</th>
                                    <th className="px-4 py-3 font-semibold text-center whitespace-nowrap">Trạng thái</th>
                                    <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Loading skeleton */}
                                {loading && users.length === 0 && (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="border-b border-slate-700/50 animate-pulse">
                                            <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-slate-700 shrink-0" /><div className="space-y-1"><div className="h-3 bg-slate-700 rounded w-28" /><div className="h-2 bg-slate-700/60 rounded w-16" /></div></div></td>
                                            <td className="px-4 py-3 space-y-2"><div className="h-3 bg-slate-700 rounded w-24" /><div className="h-2 bg-slate-700/60 rounded w-32" /></td>
                                            <td className="px-4 py-3"><div className="h-5 bg-slate-700 rounded w-14" /></td>
                                            <td className="px-4 py-3 text-center hidden xl:table-cell"><div className="h-3 bg-slate-700 rounded w-16 mx-auto" /></td>
                                            <td className="px-4 py-3 text-center"><div className="h-5 bg-slate-700 rounded w-16 mx-auto" /></td>
                                            <td className="px-4 py-3 text-right"><div className="h-7 bg-slate-700 rounded w-24 ml-auto" /></td>
                                        </tr>
                                    ))
                                )}

                                {!loading && users.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-600">
                                            Không tìm thấy user nào
                                        </td>
                                    </tr>
                                )}

                                {users.map(u => {
                                    const style = ROLE_STYLE[u.role];
                                    const isRoot = u.role === 'admin';
                                    const isActioning = actionLoading === u.id;
                                    return (
                                        <tr
                                            key={u.id}
                                            className={`border-b border-slate-700/50 hover:bg-slate-800 transition-colors ${isActioning ? 'opacity-60' : ''}`}
                                        >
                                            {/* Avatar + name */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={`https://i.pravatar.cc/150?u=${u.id}`}
                                                        alt={u.fullName}
                                                        className={`w-9 h-9 rounded-full border-2 ${style.dot} shrink-0`}
                                                    />
                                                    <div className="min-w-0">
                                                        <span className={`block font-semibold truncate max-w-[130px] sm:max-w-[160px] ${isRoot ? 'text-red-400' : 'text-slate-200'}`} title={u.fullName}>
                                                            {u.fullName}
                                                        </span>
                                                        <span className="text-xs text-slate-500 font-mono">ID: {u.id}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Account Details */}
                                            <td className="px-4 py-3 min-w-[200px]">
                                                <div className="font-mono text-slate-300 truncate max-w-[180px]" title={u.username}>
                                                    {u.username}
                                                </div>
                                                <div className="font-mono text-slate-500 text-xs truncate max-w-[180px] mt-0.5" title={u.email}>
                                                    {u.email}
                                                </div>
                                            </td>

                                            {/* Role badge */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${style.badge}`}>
                                                    {style.label}
                                                </span>
                                                {u.isLocked && (
                                                    <span className="ml-2 px-2 py-0.5 rounded text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                                        LOCKED
                                                    </span>
                                                )}
                                            </td>

                                            {/* Date */}
                                            <td className="px-4 py-3 text-center text-slate-400 font-mono hidden xl:table-cell whitespace-nowrap">
                                                {u.createdAt}
                                            </td>

                                            {/* Status */}
                                            <td className="px-4 py-3 text-center whitespace-nowrap">
                                                {u.isDeleted ? (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
                                                        Đã xóa
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                        Hoạt động
                                                    </span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3 text-right">
                                                {isRoot ? (
                                                    <div className="flex items-center justify-end whitespace-nowrap">
                                                        <span className="text-xs italic text-slate-600 block">Không thể sửa Root</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                                                        {isActioning ? (
                                                            <SpinnerGap weight="bold" className="text-slate-400 animate-spin text-lg" />
                                                        ) : (
                                                            <>
                                                                {/* Đổi quyền */}
                                                                <button
                                                                    onClick={() => openRoleModal(u)}
                                                                    title="Đổi quyền hạn"
                                                                    className="inline-flex items-center whitespace-nowrap gap-1.5 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 rounded-lg text-xs font-medium transition"
                                                                >
                                                                    <UserSwitch weight="bold" className="text-sm shrink-0" />
                                                                    Đổi quyền
                                                                </button>

                                                                {/* Khoá / Mở khoá */}
                                                                <button
                                                                    onClick={() => handleToggleLock(u)}
                                                                    title={u.isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                                                                    className={`w-8 h-8 flex items-center justify-center rounded-lg border transition ${
                                                                        u.isLocked
                                                                            ? 'bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20'
                                                                            : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                                                                    }`}
                                                                >
                                                                        {u.isLocked
                                                                        ? <LockKeyOpen weight="bold" className="text-sm" />
                                                                        : <LockKey weight="bold" className="text-sm" />
                                                                    }
                                                                </button>

                                                                {/* Xoá mềm */}
                                                                {!u.isDeleted && (
                                                                    <button
                                                                        onClick={() => openDeleteModal(u, 'soft')}
                                                                        title="Xoá mềm tài khoản (chờ 30 ngày)"
                                                                        className="w-8 h-8 flex items-center justify-center rounded-lg border bg-slate-500/10 text-slate-400 border-slate-500/20 hover:bg-slate-500/20 transition"
                                                                    >
                                                                        <Trash weight="bold" className="text-sm" />
                                                                    </button>
                                                                )}

                                                                {/* Xoá cứng */}
                                                                <button
                                                                    onClick={() => openDeleteModal(u, 'hard')}
                                                                    title="Xoá vĩnh viễn (Không thể phục hồi)"
                                                                    className="w-8 h-8 flex items-center justify-center rounded-lg border bg-red-900/20 text-red-500 border-red-500/20 hover:bg-red-500/20 hover:text-red-400 transition"
                                                                >
                                                                    <WarningCircle weight="bold" className="text-sm" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        <div className="px-6 py-4 border-t border-slate-700 flex justify-between items-center bg-slate-900/50">
                            <span className="text-sm text-slate-400 font-mono">
                                {totalElements === 0
                                    ? '0 user'
                                    : `${currentPage * PAGE_SIZE + 1}–${Math.min((currentPage + 1) * PAGE_SIZE, totalElements)} / ${totalElements} user`
                                }
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                    disabled={currentPage === 0 || loading}
                                    className="w-8 h-8 flex items-center justify-center bg-slate-800 text-slate-400 rounded hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                >
                                    <CaretLeft weight="bold" className="text-sm" />
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i)
                                    .filter(p => p === 0 || p === totalPages - 1 || Math.abs(p - currentPage) <= 1)
                                    .reduce<(number | '...')[]>((acc, p, i, arr) => {
                                        if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                                        acc.push(p);
                                        return acc;
                                    }, [])
                                    .map((item, i) =>
                                        item === '...' ? (
                                            <span key={`ellipsis-${i}`} className="px-2 text-slate-600 text-sm">…</span>
                                        ) : (
                                            <button
                                                key={item}
                                                onClick={() => setCurrentPage(item as number)}
                                                className={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium transition ${
                                                    currentPage === item
                                                        ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                                }`}
                                            >
                                                {(item as number) + 1}
                                            </button>
                                        )
                                    )
                                }

                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                                    disabled={currentPage >= totalPages - 1 || loading || totalPages === 0}
                                    className="w-8 h-8 flex items-center justify-center bg-slate-800 text-slate-400 rounded hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                >
                                    <CaretRight weight="bold" className="text-sm" />
                                </button>
                            </div>
                        </div>
                    </div>
        </AdminLayout>

        {/* ── Role Confirmation Modal */}
        {modalTarget && (
            <ConfirmRoleModal
                target={modalTarget}
                pendingRole={pendingRole}
                onChangePending={setPendingRole}
                onConfirm={handleConfirmRole}
                onCancel={() => setModalTarget(null)}
                loading={modalLoading}
            />
        )}

        {/* ── Lock Confirmation Modal */}
        {lockModalTarget && (
            <ConfirmLockModal
                target={lockModalTarget}
                onConfirm={handleConfirmLock}
                onCancel={() => setLockModalTarget(null)}
                loading={lockModalLoading}
            />
        )}

        {/* ── Delete Confirmation Modal */}
        {deleteModalTarget && (
            <ConfirmDeleteUserModal
                isOpen={!!deleteModalTarget}
                onClose={() => setDeleteModalTarget(null)}
                onConfirm={handleConfirmDelete}
                isSubmitting={deleteModalLoading}
                title={deleteModalType === 'soft' ? `Xóa tạm thời User` : `CẢNH BÁO: Xóa Vĩnh Viễn`}
                description={deleteModalType === 'soft' 
                    ? `Bạn có chắc chắn muốn xóa tạm thời user ${deleteModalTarget.username}? User sẽ mất quyền truy cập và sẽ rác vĩnh viễn sau 30 ngày.`
                    : `Hành động này sẽ XÓA VĨNH VIỄN user ${deleteModalTarget.username} và \n- Xoá toàn bộ dữ liệu cá nhân (Bài nộp).\n- Chuyển quyền Tác giả Bài tập và Cuộc thi cho Admin vĩnh viễn.\n\nHành động này KHÔNG THỂ PHỤC HỒI.`
                }
                requireConfirmationWord={deleteModalType === 'hard'}
                confirmationWord={deleteModalTarget.username}
            />
        )}
        </>
    );
};
