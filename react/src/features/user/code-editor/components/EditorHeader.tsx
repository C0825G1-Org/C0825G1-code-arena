import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, List, SignOut } from '@phosphor-icons/react';
import ContestTimer from './ContestTimer';

interface EditorHeaderProps {
    isExamMode: boolean;
    contestId?: string;
    problemId: number;
    isCapturing: boolean;
    contestTitle?: string;
    contestEndTime?: string;
    isWaitingRoom?: boolean;
    isTimeUp: boolean;
    onTimeUp: () => void;
    onManualExit: () => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
    isExamMode,
    contestId,
    problemId,
    isCapturing,
    contestTitle,
    contestEndTime,
    isWaitingRoom = false,
    isTimeUp,
    onTimeUp,
    onManualExit
}) => {
    const navigate = useNavigate();

    return (
        <header className="tour-header h-14 bg-[#0f172a] border-b border-white/5 flex items-center justify-between px-6 shrink-0 z-50">
            {/* Left: Breadcrumb & Mode Indicator */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
                    <span className="hover:text-white cursor-pointer transition-colors" onClick={() => navigate('/')}>Home</span>
                    <span className="text-slate-600">/</span>
                    <span className="hover:text-white cursor-pointer transition-colors" onClick={() => navigate(isExamMode ? `/contests/${contestId}` : '/problems')}>
                        {isExamMode ? 'Contests' : 'Problems'}
                    </span>
                    <span className="text-slate-600">/</span>
                    <span className="text-slate-200">Problem {problemId}</span>
                </div>
                {isExamMode ? (
                    <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 rounded-full flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        Exam Mode
                    </span>
                ) : (
                    <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Practice
                    </span>
                )}

                {isExamMode && !isWaitingRoom && (
                    <div className={`flex items-center gap-2 px-2.5 py-1 text-[10px] font-black uppercase tracking-tighter text-white bg-emerald-600 rounded-md shadow-sm transition-all duration-500 ${isCapturing ? 'opacity-50' : 'opacity-100'}`}>
                        <ShieldCheck size={14} weight="fill" />
                        <span>SECURE MODE</span>
                    </div>
                )}
            </div>

            {/* Middle: Title or Contest Time */}
            <div className="tour-contest-timer flex items-center justify-center flex-1">
                {isExamMode && contestEndTime && !isWaitingRoom && (
                    <div className="flex items-center gap-3 bg-[#1e293b] px-4 py-1.5 rounded-full border border-white/5 shadow-inner">
                        <List size={20} weight="bold" className="text-blue-400" />
                        <span className="text-slate-200 font-semibold truncate max-w-[200px]">{contestTitle}</span>
                        <div className="w-px h-4 bg-slate-700 mx-2"></div>
                        <ContestTimer
                            endTime={contestEndTime}
                            onTimeUp={onTimeUp}
                        />
                    </div>
                )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onManualExit}
                    className="tour-exit-btn flex items-center gap-2 px-4 py-2 hover:bg-red-500/10 text-red-400 font-bold rounded-xl transition-all border border-red-500/10 hover:border-red-500/30"
                >
                    <SignOut size={20} weight="bold" /> {isExamMode && !isWaitingRoom ? 'Kết thúc thi' : 'Thoát'}
                </button>
            </div>
        </header>
    );
};
