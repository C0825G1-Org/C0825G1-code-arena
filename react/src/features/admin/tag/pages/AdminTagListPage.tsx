import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../../app/store';
import { logout } from '../../../auth/store/authSlice';
import {
    HardDrives, SquaresFour, Users, Tag,
    SignOut, MagnifyingGlass, PencilSimple, Trash, SpinnerGap
} from '@phosphor-icons/react';
import { adminTagApi, AdminTagDTO } from '../services/adminTagApi';
import { DeleteModal } from '../components/DeleteModal';

// ─── Sidebar Link ─────────────────────────────────────────────────────────────
const SidebarLink = ({
    href, icon: Icon, label, active,
}: {
    href: string; icon: React.ElementType; label: string; active?: boolean;
}) => (
    <Link
        to={href}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all
            ${active
                ? 'bg-red-500 text-white shadow-[0_4px_14px_0_rgba(239,68,68,0.3)]'
                : 'text-slate-400 hover:bg-red-500/10 hover:text-red-400'}`}
    >
        <Icon weight="duotone" className="text-xl shrink-0" />
        {label}
    </Link>
);


const COLORS = [
    { colorClass: 'text-blue-400', bgClass: 'bg-blue-500/10', borderClass: 'border-blue-500/20' },
    { colorClass: 'text-emerald-400', bgClass: 'bg-emerald-500/10', borderClass: 'border-emerald-500/20' },
    { colorClass: 'text-purple-400', bgClass: 'bg-purple-500/10', borderClass: 'border-purple-500/20' },
    { colorClass: 'text-orange-400', bgClass: 'bg-orange-500/10', borderClass: 'border-orange-500/20' },
    { colorClass: 'text-pink-400', bgClass: 'bg-pink-500/10', borderClass: 'border-pink-500/20' },
    { colorClass: 'text-cyan-400', bgClass: 'bg-cyan-500/10', borderClass: 'border-cyan-500/20' },
];

const getTagColor = (id: number) => {
    return COLORS[id % COLORS.length];
};

export const AdminTagListPage: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [tags, setTags] = useState<AdminTagDTO[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    
    // Form state
    const [tagName, setTagName] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete Modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [tagToDelete, setTagToDelete] = useState<AdminTagDTO | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchTags = async () => {
        setLoading(true);
        try {
            const data = await adminTagApi.getAllTags();
            setTags(data);
        } catch (error) {
            console.error('Error fetching tags', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTags();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tagName.trim()) return;
        
        setIsSubmitting(true);
        try {
            if (editingId) {
                await adminTagApi.updateTag(editingId, { name: tagName.trim() });
                toast.success('Cập nhật Tag thành công!');
                setEditingId(null);
            } else {
                await adminTagApi.createTag({ name: tagName.trim() });
                toast.success('Thêm mới Tag thành công!');
            }
            setTagName('');
            fetchTags();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (tag: AdminTagDTO) => {
        setEditingId(tag.id);
        setTagName(tag.name);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setTagName('');
    };

    const handleDeleteConfirm = async () => {
        if (!tagToDelete) return;
        setIsDeleting(true);
        try {
            await adminTagApi.deleteTag(tagToDelete.id);
            if (editingId === tagToDelete.id) handleCancelEdit();
            toast.success('Xóa Tag thành công!');
            setDeleteModalOpen(false);
            setTagToDelete(null);
            fetchTags();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Không thể xóa tag này vì có thể đã được gán cho bài tập.');
        } finally {
            setIsDeleting(false);
        }
    };

    const confirmDelete = (tag: AdminTagDTO) => {
        setTagToDelete(tag);
        setDeleteModalOpen(true);
    };

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    return (
        <div className="antialiased h-screen flex overflow-hidden bg-slate-900 selection:bg-red-500/30 font-sans">
            
            {/* ── Sidebar ───────────────────────────────────────────────── */}
            <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col pt-6 pb-4 shrink-0 transition-transform duration-300 z-20">
                {/* Logo */}
                <div className="px-6 mb-8 mt-2 text-xl font-bold tracking-tight text-white flex gap-2 items-center">
                    <div className="w-8 h-8 rounded bg-red-600 flex items-center justify-center shadow-lg shadow-red-500/20">
                        <HardDrives weight="bold" className="text-lg text-white" />
                    </div>
                    CodeArena<span className="text-red-500 text-sm align-top ml-1">ADMIN</span>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-4 space-y-2">
                    <SidebarLink href="/admin/dashboard" icon={SquaresFour} label="System Dashboard" />
                    <SidebarLink href="/admin/users"     icon={Users}       label="Quản lý Users" />
                    <SidebarLink href="/admin/tags"      icon={Tag}         label="Phân loại (Tags)" active />
                </nav>

                {/* Logout */}
                <div className="px-4 mt-4 border-t border-slate-800 pt-4">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-400 transition-all font-medium border border-transparent hover:border-red-500/50"
                        title="Đăng xuất"
                    >
                        <SignOut weight="bold" className="text-xl" />
                        Đăng xuất
                    </button>
                </div>
            </aside>

            {/* ── Main Content ──────────────────────────────────────────── */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-900 text-slate-50">
                
                {/* HeaderBar */}
                <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex justify-between items-center px-8 z-10 sticky top-0 shrink-0">
                    <h1 className="text-xl font-semibold text-white">Quản lý Phân loại (Tags) Hệ thống</h1>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            <span className="text-red-400 text-xs font-bold uppercase tracking-wider hidden sm:block">
                                Root Access
                            </span>
                        </div>
                        <div className="h-6 w-px bg-slate-700 hidden sm:block"></div>
                        {/* Profile */}
                        <div className="relative flex items-center gap-3 cursor-pointer hover:bg-slate-800 p-2 rounded-lg transition">
                            <div className="text-right hidden sm:block">
                                <div className="text-sm font-semibold text-white leading-tight">{user?.fullName || 'System Admin'}</div>
                                <div className="text-xs text-slate-400 font-mono">ID: {user?.id || 1}</div>
                            </div>
                            <img 
                                src={`https://i.pravatar.cc/150?u=${user?.id || 1}`}
                                alt="Admin Avatar"
                                className="w-10 h-10 rounded-full border border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" 
                            />
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 flex gap-8">
                    
                    {/* Left: Table of Tags */}
                    <div className="w-2/3">
                        <div className="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700">
                            
                            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
                                <div className="relative w-72">
                                    <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                                    <input 
                                        type="text" 
                                        placeholder="Tìm kiếm tag..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg focus:ring-1 focus:ring-red-500 focus:border-red-500 block pl-10 pr-4 py-2 outline-none transition-all placeholder:text-slate-500" 
                                    />
                                </div>
                            </div>

                            <table className="w-full text-sm text-left text-slate-400">
                                <thead className="text-xs uppercase bg-slate-800/80 text-slate-300 border-b border-slate-700">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold w-16">ID</th>
                                        <th className="px-6 py-4 font-semibold">Tên Tag (Chuyên đề)</th>
                                        <th className="px-6 py-4 font-semibold text-center">Số bài gán nhãn</th>
                                        <th className="px-6 py-4 font-semibold text-right">Quản lý</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                                <SpinnerGap weight="bold" className="text-2xl animate-spin mx-auto mb-2" />
                                                Đang tải dữ liệu...
                                            </td>
                                        </tr>
                                    ) : (
                                        tags.filter(t => t.name.toLowerCase().includes(search.toLowerCase())).map((tag) => {
                                            const colors = getTagColor(tag.id);
                                            return (
                                                <tr key={tag.id} className="border-b border-slate-700/50 hover:bg-slate-800 transition-colors">
                                                    <td className="px-6 py-4 font-mono">{tag.id}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center gap-1.5 py-1 px-3 rounded-md text-xs font-medium ${colors.bgClass} ${colors.colorClass} border ${colors.borderClass}`}>
                                                            <Tag weight="bold" /> {tag.name}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-mono text-slate-500 italic">
                                                        {tag.count ?? 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button 
                                                            className="p-2 text-slate-400 hover:text-blue-400 transition" 
                                                            title="Chỉnh sửa"
                                                            onClick={() => handleEdit(tag)}
                                                        >
                                                            <PencilSimple weight="bold" className="text-base" />
                                                        </button>
                                                        <button 
                                                            className="p-2 text-slate-400 hover:text-red-400 transition ml-2" 
                                                            title="Xóa"
                                                            onClick={() => confirmDelete(tag)}
                                                        >
                                                            <Trash weight="bold" className="text-base" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                    {!loading && tags.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-600">
                                                Không có tag nào.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right: Add/Edit Form */}
                    <div className="w-1/3">
                        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 sticky top-0">
                            <h2 className="text-lg font-bold text-white mb-4 pb-2 border-b border-slate-700 flex justify-between items-center">
                                <span>{editingId ? 'Sửa Tag' : 'Thêm Tag Hệ thống'}</span>
                                {editingId && (
                                    <button 
                                        onClick={handleCancelEdit}
                                        className="text-xs text-slate-400 hover:text-slate-200"
                                    >
                                        Hủy
                                    </button>
                                )}
                            </h2>

                            <form className="space-y-4" onSubmit={handleSubmit}>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">
                                        Tên Tag (Ví dụ: String, Tree)
                                    </label>
                                    <input 
                                        type="text" 
                                        value={tagName}
                                        onChange={(e) => setTagName(e.target.value)}
                                        placeholder="Nhập tên tag..."
                                        className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg focus:ring-1 focus:ring-red-500 focus:border-red-500 block p-2.5 outline-none transition-all placeholder:text-slate-500" 
                                        required
                                    />
                                </div>
                                
                                <div className="pt-2">
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting || !tagName.trim()}
                                        className="w-full bg-red-600 hover:bg-red-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg text-sm font-medium transition shadow-lg shadow-red-500/20 flex justify-center items-center gap-2"
                                    >
                                        {isSubmitting && <SpinnerGap className="animate-spin" />}
                                        {editingId ? 'Cập nhật' : 'Lưu Tag Mới'}
                                    </button>
                                </div>
                                <div className="text-xs text-slate-500 italic mt-2 text-center">
                                    Tag được sử dụng để phân loại cấu trúc bài tập thuật toán. Moderator sẽ dùng lúc soạn bài.
                                </div>
                            </form>
                        </div>
                    </div>

                </div>
            </main>

            <DeleteModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Xác nhận Xóa Tag"
                description={`Bạn có thực sự muốn xóa tag "${tagToDelete?.name}"? Các bài tập đang dùng tag này cũng có thể bị ảnh hưởng. Hành động này không thể hoàn tác.`}
                isDeleting={isDeleting}
            />
        </div>
    );
};
