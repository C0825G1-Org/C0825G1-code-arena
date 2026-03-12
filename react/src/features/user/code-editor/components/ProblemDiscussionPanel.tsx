import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../app/store';
import axiosClient from '../../../../shared/services/axiosClient';
import { ChatCircleDots, PaperPlaneRight, Trash, User } from '@phosphor-icons/react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import { toast } from 'react-toastify';
import { chatService } from '../../../chat/services/chatService';
import { useRef } from 'react';
import { ConfirmModal } from '../../../../shared/components/ConfirmModal';
import { Avatar } from '../../../../shared/components/Avatar';
import UserNameWithRank from '../../../../shared/components/UserNameWithRank';

dayjs.extend(relativeTime);
dayjs.locale('vi');

interface DiscussionMessage {
    id: number;
    problemId: number;
    userId: number;
    userFullName: string;
    userUsername: string;
    userAvatar: string | null;
    content: string;
    userIsDiscussionLocked?: boolean;
    userGlobalRating?: number;
    createdAt: string;
    updatedAt: string;
}

export const ProblemDiscussionPanel = ({ problemId }: { problemId: number }) => {
    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
    const [messages, setMessages] = useState<DiscussionMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [menuPosition, setMenuPosition] = useState<{ x: number, y: number } | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Edit state
    const [editingMsgId, setEditingMsgId] = useState<number | null>(null);
    const [editValue, setEditValue] = useState('');

    // Modal state
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: 'danger' | 'warning' | 'info';
        title: string;
        description: string;
        onConfirm: () => void;
        icon: 'trash' | 'lock' | 'unlock';
        isLoading: boolean;
    }>({
        isOpen: false,
        type: 'warning',
        title: '',
        description: '',
        onConfirm: () => { },
        icon: 'warning' as any,
        isLoading: false
    });

    const fetchDiscussions = async (pageNum = 0, append = false) => {
        try {
            const res: any = await axiosClient.get(`/problems/${problemId}/discussions`, {
                params: { page: pageNum, size: 20 }
            });
            const data = res.content || [];
            if (append) {
                setMessages(prev => [...prev, ...data]);
            } else {
                setMessages(data);
            }
            setHasMore(!res.last);
        } catch (error) {
            console.error('Failed to fetch discussions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        setPage(0);
        fetchDiscussions(0, false);
    }, [problemId]);

    const handleSend = async () => {
        if (!inputValue.trim() || user?.isDiscussionLocked) return;
        try {
            const res: any = await axiosClient.post(`/problems/${problemId}/discussions`, {
                content: inputValue
            });
            setMessages(prev => [res, ...prev]);
            setInputValue('');
            toast.success("Đã gửi bình luận!");
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Gửi bình luận thất bại!');
        }
    };

    const handleUserClick = (e: React.MouseEvent, msg: DiscussionMessage) => {
        const userRole = user?.role?.toUpperCase();
        const isModOrAdmin = userRole === 'MODERATOR' || userRole === 'ADMIN';
        if (!isModOrAdmin || msg.userId === user?.id) return;

        e.preventDefault();
        setMenuPosition({ x: e.clientX, y: e.clientY });
        setSelectedUser({
            id: msg.userId,
            username: msg.userUsername,
            isLocked: msg.userIsDiscussionLocked,
            targetMsgId: msg.id
        });
    };

    const toggleLock = async () => {
        if (!selectedUser) return;
        const isLocking = !selectedUser.isLocked;
        const action = isLocking ? 'khóa' : 'mở khóa';

        setConfirmModal({
            isOpen: true,
            type: isLocking ? 'danger' : 'info',
            title: `${isLocking ? 'Khóa' : 'Mở khóa'} thảo luận`,
            description: `Bạn có chắc muốn ${action} quyền thảo luận của người dùng ${selectedUser.username}?`,
            icon: isLocking ? 'lock' : 'unlock',
            isLoading: false,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isLoading: true }));
                try {
                    await chatService.toggleUserLock(selectedUser.id, 'discussion', isLocking);
                    setMessages(prev => prev.map(m => m.userId === selectedUser.id ? { ...m, userIsDiscussionLocked: isLocking } : m));
                    setSelectedUser(null);
                    setMenuPosition(null);
                    toast.success(`Đã ${action} thành công.`);
                } catch (error) {
                    toast.error("Thao tác thất bại.");
                } finally {
                    setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
                }
            }
        });
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setSelectedUser(null);
                setMenuPosition(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleDelete = async (discussionId: number) => {
        setConfirmModal({
            isOpen: true,
            type: 'danger',
            title: 'Xóa bình luận',
            description: 'Bạn có chắc chắn muốn xóa bình luận này? Hành động này không thể hoàn tác.',
            icon: 'trash',
            isLoading: false,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isLoading: true }));
                try {
                    await axiosClient.delete(`/problems/${problemId}/discussions/${discussionId}`);
                    setMessages(prev => prev.filter(m => m.id !== discussionId));
                    toast.success("Đã xóa bình luận!");
                    setSelectedUser(null);
                    setMenuPosition(null);
                } catch (error) {
                    toast.error("Không thể xóa bình luận này.");
                } finally {
                    setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
                }
            }
        });
    };

    const handleUpdate = async (discussionId: number) => {
        if (!editValue.trim() || user?.isDiscussionLocked) return;
        try {
            const res: any = await axiosClient.put(`/problems/${problemId}/discussions/${discussionId}`, {
                content: editValue
            });
            setMessages(prev => prev.map(m => m.id === discussionId ? res : m));
            setEditingMsgId(null);
            setEditValue('');
            toast.success("Đã cập nhật bình luận!");
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Cập nhật thất bại!');
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#1e293b]">
            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-[#0f172a]/50">
                <h3 className="font-bold text-white flex items-center gap-2">
                    <ChatCircleDots className="text-blue-500" size={24} weight="fill" />
                    Thảo luận ({messages.length})
                </h3>
            </div>

            {/* Message List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {loading && page === 0 ? (
                    <div className="text-center text-slate-500 py-10">Đang tải...</div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-slate-500 py-10">Chưa có thảo luận nào. Hãy là người đầu tiên!</div>
                ) : (
                    <>
                        {messages.map((msg) => (
                            <div key={msg.id} className="flex gap-3 items-start group relative">
                                <Avatar
                                    src={msg.userAvatar}
                                    userId={msg.userId}
                                    size="md"
                                    alt={msg.userFullName}
                                    className="border-2 border-blue-500/40 shadow-md"
                                    onClick={(e) => handleUserClick(e, msg)}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <div onClick={(e) => handleUserClick(e, msg)} className="cursor-pointer">
                                            <UserNameWithRank username={msg.userFullName} globalRating={msg.userGlobalRating} className="text-sm" />
                                        </div>
                                        <span className="text-xs text-slate-500">@{msg.userUsername}</span>
                                        <span className="text-xs text-slate-500">• {dayjs(msg.createdAt).fromNow()}</span>
                                        {msg.updatedAt && dayjs(msg.updatedAt).isAfter(dayjs(msg.createdAt).add(1, 'second')) && (
                                            <span className="text-[10px] text-slate-600 italic">(đã chỉnh sửa)</span>
                                        )}
                                    </div>

                                    {editingMsgId === msg.id ? (
                                        <div className="flex flex-col gap-2">
                                            <textarea
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                className="w-full bg-slate-900 text-sm text-slate-200 rounded-xl px-3 py-2 border border-blue-500 focus:outline-none min-h-[60px] max-h-32"
                                                autoFocus
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleUpdate(msg.id)}
                                                    className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded transition-colors"
                                                >
                                                    Lưu
                                                </button>
                                                <button
                                                    onClick={() => setEditingMsgId(null)}
                                                    className="text-[10px] bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-1 rounded transition-colors"
                                                >
                                                    Hủy
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-sm text-slate-300 bg-slate-800/50 p-3 rounded-2xl rounded-tl-none border border-slate-700/50">
                                                {msg.content}
                                            </div>
                                            {msg.userIsDiscussionLocked && (
                                                <div className="mt-1 flex items-center gap-1 text-[10px] text-red-400 font-medium">
                                                    <i className="ph ph-lock-key text-xs" /> Người dùng bị chặn thảo luận
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                                {/* Nút thao tác (Sửa/Xóa) */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    {user && user.id === msg.userId && !user.isDiscussionLocked && (
                                        <button
                                            onClick={() => { setEditingMsgId(msg.id); setEditValue(msg.content); }}
                                            className="text-slate-500 hover:text-blue-400 p-1.5 hover:bg-blue-500/10 rounded transition-all"
                                            title="Sửa bình luận"
                                        >
                                            <i className="ph ph-pencil-simple text-base" />
                                        </button>
                                    )}
                                    {user && (user.id === msg.userId || user?.role?.toUpperCase() === 'ADMIN' || user?.role?.toUpperCase() === 'MODERATOR') && (
                                        <button
                                            onClick={() => handleDelete(msg.id)}
                                            className="text-slate-500 hover:text-red-400 p-1.5 hover:bg-red-500/10 rounded transition-all"
                                            title="Xóa bình luận"
                                        >
                                            <Trash size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {hasMore && (
                            <div className="text-center pt-4">
                                <button
                                    onClick={() => {
                                        const nextPage = page + 1;
                                        setPage(nextPage);
                                        fetchDiscussions(nextPage, true);
                                    }}
                                    className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
                                >
                                    Tải thêm bình luận cũ
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Input Box */}
            <div className="p-4 border-t border-white/5 bg-[#0f172a]/50">
                {isAuthenticated ? (
                    <div className="flex items-start gap-3">
                        <Avatar
                            src={user?.avatarUrl}
                            userId={user?.id}
                            size="md"
                            alt="Me"
                            className="border-2 border-blue-500/40"
                        />
                        <div className="flex-1 relative">
                            <textarea
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={user?.isDiscussionLocked ? "Bạn đã bị chặn thảo luận..." : "Viết bình luận của bạn..."}
                                disabled={!!user?.isDiscussionLocked}
                                className="w-full bg-[#1e293b] text-sm text-slate-200 rounded-xl px-4 py-3 min-h-[44px] max-h-32 resize-none border border-slate-700 focus:outline-none focus:border-blue-500 transition-colors scrollbar-thin scrollbar-thumb-slate-700 disabled:opacity-50"
                                rows={Math.min(4, inputValue.split('\n').length)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!inputValue.trim() || !!user?.isDiscussionLocked}
                                className="absolute right-2 bottom-2 p-1.5 text-blue-500 hover:text-blue-400 disabled:opacity-30 disabled:hover:text-blue-500 transition-colors"
                            >
                                <PaperPlaneRight size={20} weight="fill" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-sm text-slate-400 p-2">
                        Vui lòng <a href="/login" className="text-blue-400 hover:underline">đăng nhập</a> để tham gia thảo luận.
                    </div>
                )}
            </div>

            {/* Moderator Action Menu */}
            {selectedUser && menuPosition && (
                <div
                    ref={menuRef}
                    className="fixed bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-[200] min-w-[150px]"
                    style={{ left: menuPosition.x, top: menuPosition.y }}
                >
                    <div className="px-3 py-2 border-b border-slate-700 bg-slate-900/50">
                        <span className="text-xs font-bold text-slate-400 block truncate">{selectedUser.username}</span>
                    </div>
                    <button
                        onClick={toggleLock}
                        className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-2 transition-colors"
                    >
                        <i className={`ph ${selectedUser.isLocked ? 'ph-lock-key-open' : 'ph-lock-key'} text-blue-400`} />
                        {selectedUser.isLocked ? 'Mở khóa thảo luận' : 'Khóa thảo luận'}
                    </button>
                    <button
                        className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                        onClick={() => { handleDelete(selectedUser.targetMsgId); setSelectedUser(null); }}
                    >
                        <i className="ph ph-trash" />
                        Xóa bình luận
                    </button>
                </div>
            )}

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                description={confirmModal.description}
                type={confirmModal.type as any}
                icon={confirmModal.icon}
                isLoading={confirmModal.isLoading}
            />
        </div>
    );
};
