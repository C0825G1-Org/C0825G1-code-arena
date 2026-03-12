import React from 'react';
import { WarningCircle, ArrowsOut } from '@phosphor-icons/react';

interface FullscreenWarningOverlayProps {
    timeLeft: number;
    onEnterFullscreen: () => void;
}

export const FullscreenWarningOverlay: React.FC<FullscreenWarningOverlayProps> = ({ timeLeft, onEnterFullscreen }) => {
    return (
        <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-300">
            {/* Background Effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
            
            <div className="relative z-10 flex flex-col items-center max-w-2xl w-full px-6 text-center">
                <div className="mb-8 relative">
                    <div className="absolute inset-0 bg-red-500 blur-xl opacity-50 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
                    <WarningCircle weight="fill" className="text-[120px] text-red-500 relative z-10 drop-shadow-[0_0_30px_rgba(239,68,68,0.8)]" />
                </div>
                
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6 uppercase">
                    Cảnh Báo <br/><span className="text-red-500">Thoát Toàn Màn Hình</span>
                </h1>
                
                <p className="text-xl text-slate-300 mb-8 leading-relaxed font-medium">
                    Hệ thống phát hiện bạn đã thoát chế độ thi chuẩn.<br />
                    Vui lòng quay lại ngay lập tức để tránh bị ghi nhận gian lận!
                </p>
                
                <div className="bg-red-500/10 border-2 border-red-500/30 rounded-3xl p-8 mb-10 w-full md:w-auto shadow-[0_0_50px_rgba(239,68,68,0.15)]">
                    <div className="text-slate-400 font-bold mb-2 uppercase tracking-widest text-sm">Hệ thống sẽ ghi nhận vi phạm sau</div>
                    <div className="text-7xl font-black text-red-500 drop-shadow-lg font-mono">
                        {timeLeft}
                        <span className="text-3xl text-red-400 font-bold ml-2">giây</span>
                    </div>
                </div>
                
                <button
                    onClick={onEnterFullscreen}
                    className="group relative px-10 py-5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-2xl font-black text-xl flex items-center gap-4 transition-all hover:scale-105 active:scale-95 shadow-[0_15px_40px_rgba(225,29,72,0.4)] border border-red-400/50"
                >
                    <ArrowsOut weight="bold" className="text-3xl group-hover:animate-bounce" />
                    QUAY LẠI TOÀN MÀN HÌNH NGAY
                </button>
                
                <p className="mt-8 text-slate-500 text-sm font-medium">
                    Nhấn nút trên hoặc ấn phím <kbd className="bg-slate-800 px-2 py-1 rounded text-slate-300 font-mono border border-slate-700">F11</kbd> trên bàn phím
                </p>
            </div>
        </div>
    );
};
