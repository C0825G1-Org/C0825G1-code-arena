import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../app/store';
import axiosClient from '../../../../shared/services/axiosClient';
import { ChatCircleDots, PaperPlaneRight, Trash, User } from '@phosphor-icons/react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import { toast } from 'react-toastify';

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
    createdAt: string;
}

export const ProblemDiscussionPanel = ({ problemId }: { problemId: number }) => {
    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
    const [messages, setMessages] = useState<DiscussionMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

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
        if (!inputValue.trim()) return;
        try {
            const res: any = await axiosClient.post(`/problems/${problemId}/discussions`, {
                content: inputValue
            });
            setMessages(prev => [res, ...prev]);
            setInputValue('');
            toast.success("Đã gửi bình luận!");
        } catch (error) {
            toast.error('Gửi bình luận thất bại!');
        }
    };

    const handleDelete = async (discussionId: number) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa bình luận này?")) return;
        try {
            await axiosClient.delete(`/problems/${problemId}/discussions/${discussionId}`);
            setMessages(prev => prev.filter(m => m.id !== discussionId));
            toast.success("Đã xóa bình luận!");
        } catch (error) {
            toast.error("Không thể xóa bình luận này.");
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
                            <div key={msg.id} className="flex gap-3 items-start group">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 flex-shrink-0 border border-slate-700">
                                    <img
                                        src={msg.userAvatar || `https://i.pravatar.cc/150?u=${msg.userId}`}
                                        alt={msg.userFullName}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-slate-200 text-sm">{msg.userFullName}</span>
                                        <span className="text-xs text-slate-500">@{msg.userUsername}</span>
                                        <span className="text-xs text-slate-500">• {dayjs(msg.createdAt).fromNow()}</span>
                                    </div>
                                    <div className="text-sm text-slate-300 bg-slate-800/50 p-3 rounded-2xl rounded-tl-none border border-slate-700/50">
                                        {msg.content}
                                    </div>
                                </div>
                                {/* Nút xóa (chỉ hiện khi là người tạo hoặc admin/mod) */}
                                {user && (user.id === msg.userId || user.role === 'ADMIN' || user.role === 'MODERATOR') && (
                                    <button
                                        onClick={() => handleDelete(msg.id)}
                                        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-2 transition-all"
                                    >
                                        <Trash size={16} />
                                    </button>
                                )}
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
                    <div className="flex items-end gap-2">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 flex-shrink-0 border border-slate-700">
                            {user?.avatarUrl ? (
                                <img src={user.avatarUrl} alt="Me" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400"><User size={20} /></div>
                            )}
                        </div>
                        <div className="flex-1 relative">
                            <textarea
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Viết bình luận của bạn..."
                                className="w-full bg-[#1e293b] text-sm text-slate-200 rounded-xl px-4 py-3 min-h-[44px] max-h-32 resize-none border border-slate-700 focus:outline-none focus:border-blue-500 transition-colors scrollbar-thin scrollbar-thumb-slate-700"
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
                                disabled={!inputValue.trim()}
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
        </div>
    );
};
