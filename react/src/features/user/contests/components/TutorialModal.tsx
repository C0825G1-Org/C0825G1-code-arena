import React from 'react';
import { X, PlayCircle, Info } from '@phosphor-icons/react';

interface TutorialModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in zoom-in duration-300">
            <div className="bg-[#1e293b] border border-white/10 w-full max-w-4xl rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative">
                {/* Close Button Floating */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-10 p-2 bg-slate-800/80 hover:bg-red-500 rounded-full transition-all text-white group"
                >
                    <X size={24} weight="bold" className="group-hover:scale-110 transition-transform" />
                </button>

                {/* Header Area */}
                <div className="px-10 py-8 bg-gradient-to-r from-blue-600/10 to-transparent">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/20 rounded-2xl">
                            <PlayCircle weight="duotone" className="text-blue-400 text-3xl" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight">Hướng dẫn làm bài thi</h2>
                            <p className="text-slate-400 text-sm mt-1 flex items-center gap-1.5">
                                <Info size={16} /> Dành cho thí sinh lần đầu tham gia Code Arena
                            </p>
                        </div>
                    </div>
                </div>

                {/* Video Container */}
                <div className="px-10 pb-10 flex flex-col gap-6">
                    <div className="relative aspect-video rounded-3xl overflow-hidden border-4 border-slate-700/50 bg-black shadow-inner group">
                        {/* Placeholder/Video - Thay src bằng link thực tế khi có */}
                        <iframe
                            className="w-full h-full"
                            src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                        ></iframe>

                        {/* Overlay if not playing */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none flex items-end p-8">
                            <div className="text-white">
                                <span className="px-3 py-1 bg-blue-600 rounded-full text-xs font-bold uppercase tracking-widest mb-2 inline-block">Official Guide</span>
                                <h3 className="text-lg font-bold">Thao tác trên Trình soạn thảo Code Arena</h3>
                            </div>
                        </div>
                    </div>

                    {/* Quick Tips */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-800/50 rounded-2xl border border-white/5 space-y-2">
                            <div className="text-blue-400 font-bold text-sm uppercase tracking-wider">Bước 1</div>
                            <p className="text-xs text-slate-400 leading-relaxed">Chọn ngôn ngữ lập trình phù hợp ở thanh công cụ phía trên trang soạn thảo.</p>
                        </div>
                        <div className="p-4 bg-slate-800/50 rounded-2xl border border-white/5 space-y-2">
                            <div className="text-emerald-400 font-bold text-sm uppercase tracking-wider">Bước 2</div>
                            <p className="text-xs text-slate-400 leading-relaxed">Viết code và nhấn "Chạy thử" để kiểm tra với các Sample Test Cases.</p>
                        </div>
                        <div className="p-4 bg-slate-800/50 rounded-2xl border border-white/5 space-y-2">
                            <div className="text-purple-400 font-bold text-sm uppercase tracking-wider">Bước 3</div>
                            <p className="text-xs text-slate-400 leading-relaxed">Nhấn "Nộp bài" để hệ thống chấm điểm chính thức và ghi lại kết quả.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
