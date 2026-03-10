import React, { useState, useEffect, useRef } from 'react';
import { useChatSocket } from '../hooks/useChatSocket';
import { chatService, ChatMessage } from '../services/chatService';
import { PaperPlaneRight, ChatCircleDots, X, Minus, CornersOut, User } from '@phosphor-icons/react';
import dayjs from 'dayjs';

interface GroupChatProps {
    contestId: number;
    currentUser: {
        id: number;
        fullName?: string;
        username: string;
    };
}

export const GroupChat: React.FC<GroupChatProps> = ({ contestId, currentUser }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Fetch history
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
    });

    // Auto scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen, isMinimized]);

    const handleSend = () => {
        if (!inputValue.trim() || !connected) return;
        sendMessage(inputValue);
        setInputValue('');
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 z-[100]"
                title="Chat nhóm cuộc thi"
            >
                <ChatCircleDots size={32} weight="fill" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0f172a]" />
            </button>
        );
    }

    return (
        <div className={`fixed bottom-6 right-6 w-80 sm:w-96 bg-[#1e293b] border border-slate-700/50 rounded-2xl shadow-2xl flex flex-col transition-all z-[100] ${isMinimized ? 'h-14' : 'h-[500px]'}`}>
            {/* Header */}
            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/50 rounded-t-2xl">
                <div className="flex items-center gap-2">
                    <ChatCircleDots size={24} weight="fill" className="text-blue-400" />
                    <span className="font-bold text-slate-100">Contest Chat</span>
                    <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
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
                                        <span className="text-xs text-slate-400 mb-1 ml-1">{msg.senderName}</span>
                                    )}
                                    <div className={`flex items-end gap-2 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <div className={`w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-slate-700 bg-slate-800 ${isMe ? 'hidden' : 'flex items-center justify-center'}`}>
                                            {msg.senderAvatar ? (
                                                <img src={msg.senderAvatar} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={16} />
                                            )}
                                        </div>
                                        <div className={`px-3 py-2 rounded-2xl text-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700'}`}>
                                            {msg.content}
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
                                placeholder={connected ? "Nhập tin nhắn..." : "Đang kết nối..."}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                disabled={!connected}
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
        </div>
    );
};
