import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
    Tag, MagnifyingGlass, PencilSimple, Trash, SpinnerGap
} from '@phosphor-icons/react';
import { adminTagApi, AdminTagDTO } from '../services/adminTagApi';
import { DeleteModal } from '../components/DeleteModal';
import { AdminLayout } from '../../components/AdminLayout';

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

    return (
        <>
        <AdminLayout title="Quản lý Phân loại (Tags) Hệ thống" activeTab="tags" contentClassName="flex-1 overflow-y-auto p-8 flex gap-8">
            
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

                </AdminLayout>

            <DeleteModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Xác nhận Xóa Tag"
                description={`Bạn có thực sự muốn xóa tag "${tagToDelete?.name}"? Các bài tập đang dùng tag này cũng có thể bị ảnh hưởng. Hành động này không thể hoàn tác.`}
                isDeleting={isDeleting}
            />
        </>
    );
};
