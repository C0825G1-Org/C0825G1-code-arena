import React, { useState, useEffect, useRef } from 'react';
import { useChatSocket } from '../hooks/useChatSocket';
import { chatService, ChatMessage } from '../services/chatService';
import { PaperPlaneRight, ChatCircleDots, X, Minus, CornersOut, User } from '@phosphor-icons/react';
import dayjs from 'dayjs';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';
import { toast } from 'react-toastify';
import { Avatar } from '../../../shared/components/Avatar';
import UserNameWithRank from '../../../shared/components/UserNameWithRank';

interface GroupChatProps {
    contestId: number;
    currentUser: {
        id: number;
        fullName?: string;
        username: string;
        role?: string;
        isContestChatLocked?: boolean;
    };
    contestTitle?: string;
    contestStatus?: string;
    endTime?: string;
}

export const GroupChat: React.FC<GroupChatProps> = ({ contestId, currentUser, contestTitle, contestStatus, endTime }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [menuPosition, setMenuPosition] = useState<{ x: number, y: number } | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

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

    // Post-contest Countdown Logic
    const [postContestTimeLeft, setPostContestTimeLeft] = useState<number | null>(null);
    const [showChat, setShowChat] = useState(true);

    const scrollRef = useRef<HTMLDivElement>(null);

    // Fetch history
    useEffect(() => {
        if (contestStatus?.toLowerCase() === 'finished' && endTime) {
            const calculateTimeLeft = () => {
                const end = new Date(endTime).getTime();
                const now = new Date().getTime();
                const diffSeconds = Math.floor((now - end) / 1000);

                if (diffSeconds >= 900) { // 15 phút = 900 giây
                    setShowChat(false);
                    setPostContestTimeLeft(0);
                } else if (diffSeconds >= 0) {
                    setShowChat(true);
                    setPostContestTimeLeft(900 - diffSeconds);
                } else {
                    // Chờ đến lúc endTime (chưa Finished thực sự)
                    setPostContestTimeLeft(null);
                }
            };

            calculateTimeLeft();
            const timer = setInterval(calculateTimeLeft, 1000);
            return () => clearInterval(timer);
        } else {
            setPostContestTimeLeft(null);
            setShowChat(true);
        }
    }, [contestStatus, endTime]);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await chatService.getHistory(contestId);
                setMessages(Array.isArray(history) ? history : []);
            } catch (error) {
                console.error("Failed to fetch chat history", error);
            }
        };
        fetchHistory();
    }, [contestId]);

    // Handle incoming messages
    const { connected, sendMessage } = useChatSocket(contestId, (msg) => {
        if (msg) {
            setMessages((prev) => [...(Array.isArray(prev) ? prev : []), msg]);
        }
    }, (errorMsg) => {
        toast.error(errorMsg);
    });

    // Auto scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen, isMinimized]);

    const handleSend = () => {
        if (!inputValue.trim() || !connected || currentUser.isContestChatLocked) return;
        sendMessage(inputValue);
        setInputValue('');
    };

    const handleUserClick = (e: React.MouseEvent, msg: ChatMessage) => {
        const isModOrAdmin = currentUser.role?.toLowerCase() === 'moderator' || currentUser.role?.toLowerCase() === 'admin';
        if (!isModOrAdmin || msg.senderId === currentUser.id) return;

        e.preventDefault();
        setMenuPosition({ x: e.clientX, y: e.clientY });
        setSelectedUser({
            id: msg.senderId,
            username: msg.senderName,
            isLocked: msg.userIsChatLocked
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

    const toggleLock = async () => {
        if (!selectedUser) return;
        const isLocking = !selectedUser.isLocked;
        const action = isLocking ? 'khóa' : 'mở khóa';

        setConfirmModal({
            isOpen: true,
            type: isLocking ? 'danger' : 'info',
            title: `${isLocking ? 'Khóa' : 'Mở khóa'} Chat`,
            description: `Bạn có chắc muốn ${action} quyền gửi tin nhắn của người dùng ${selectedUser.username}?`,
            icon: isLocking ? 'lock' : 'unlock',
            isLoading: false,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isLoading: true }));
                try {
                    await chatService.toggleUserLock(selectedUser.id, 'chat', isLocking);
                    setMessages(prev => prev.map(m => m.senderId === selectedUser.id ? { ...m, userIsChatLocked: isLocking } : m));
                    setSelectedUser(null);
                    setMenuPosition(null);
                    toast.success(`Đã ${action} chat thành công.`);
                } catch (error) {
                    toast.error("Thao tác thất bại.");
                } finally {
                    setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
                }
            }
        });
    };

    if (!showChat) return null;

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 z-[9999]"
                title="Chat nhóm cuộc thi"
            >
                <ChatCircleDots size={32} weight="fill" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0f172a]" />
            </button>
        );
    }

    return (
        <div className={`fixed bottom-6 right-6 w-80 sm:w-96 bg-[#1e293b] border border-slate-700/50 rounded-2xl shadow-2xl flex flex-col transition-all z-[9999] ${isMinimized ? 'h-14' : 'h-[500px]'}`}>
            {/* Header */}
            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/50 rounded-t-2xl">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <ChatCircleDots size={24} weight="fill" className="text-blue-400" />
                        <span className="font-bold text-slate-100 max-w-[200px] truncate" title={contestTitle || 'Contest Chat'}>
                            {contestTitle || 'Contest Chat'}
                        </span>
                        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                    </div>
                    {postContestTimeLeft !== null && (
                        <div className="text-xs text-amber-400 mt-0.5 ml-8 animate-pulse">
                            Đóng sau: {Math.floor(postContestTimeLeft / 60)}:{(postContestTimeLeft % 60).toString().padStart(2, '0')}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsMinimized(!isMinimized)} className="text-slate-400 hover:text-white p-1 hover:bg-slate-700 rounded transition-colors">
                        {isMinimized ? <CornersOut size={18} /> : <Minus size={18} />}
                    </button>
                    <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-red-400 p-1 hover:bg-red-500/10 rounded transition-colors">
                        <X size={18} />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {/* Message list */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
                        {messages.length === 0 && (
                            <div className="text-center text-slate-500 text-sm mt-10">
                                Chưa có tin nhắn nào. Bắt đầu cuộc trò chuyện!
                            </div>
                        )}
                        {messages.map((msg, idx) => {
                            const isMe = msg.senderId === currentUser.id;
                            const showName = idx === 0 || messages[idx - 1].senderId !== msg.senderId;

                            return (
                                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    {showName && !isMe && (
                                        <div className="mb-1 ml-1" onClick={(e) => handleUserClick(e, msg)}>
                                            <UserNameWithRank username={msg.senderName} globalRating={msg.senderGlobalRating} type="contest" className="text-xs" />
                                        </div>
                                    )}
                                    <div className={`flex items-end gap-2 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <Avatar
                                            src={msg.senderAvatar}
                                            frameUrl={msg.senderAvatarFrame}
                                            userId={msg.senderId}
                                            size="sm"
                                            alt={msg.senderName}
                                            onClick={(e) => handleUserClick(e, msg)}
                                            className={isMe ? 'hidden' : ''}
                                        />
                                        <div className="flex flex-col gap-0.5">
                                            <div className={`px-3 py-2 rounded-2xl text-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700'}`}>
                                                {msg.content}
                                            </div>
                                            {msg.userIsChatLocked && !isMe && (
                                                <span className="text-[9px] text-red-400 flex items-center gap-0.5 mt-0.5">
                                                    <i className="ph ph-lock-key text-[10px]" /> Đã bị khóa
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-slate-500 mt-1 mx-1">
                                        {dayjs(msg.timestamp).format('HH:mm')}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-slate-800/30 border-t border-slate-700/50">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder={currentUser.isContestChatLocked ? "Bạn đã bị khóa tính năng chat" : (connected ? "Nhập tin nhắn..." : "Đang kết nối...")}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                disabled={!connected || currentUser.isContestChatLocked}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-4 pr-12 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!inputValue.trim() || !connected}
                                className="absolute right-2 top-1.5 p-1.5 text-blue-500 hover:text-blue-400 disabled:opacity-30 transition-colors"
                            >
                                <PaperPlaneRight size={20} weight="fill" />
                            </button>
                        </div>
                    </div>
                </>
            )}

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
                        className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-2"
                    >
                        <i className={`ph ${selectedUser.isLocked ? 'ph-lock-key-open' : 'ph-lock-key'} text-blue-400`} />
                        {selectedUser.isLocked ? 'Mở khóa Chat' : 'Khóa Chat'}
                    </button>
                    <button
                        className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                        onClick={() => { alert('Tính năng Xóa tin nhắn sẽ được bổ sung sau'); setSelectedUser(null); }}
                    >
                        <i className="ph ph-trash" />
                        Xóa tin nhắn
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
