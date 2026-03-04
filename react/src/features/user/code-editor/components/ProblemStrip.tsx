import React from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';

interface ProblemStripProps {
    problemsList: any[];
    currentProblemIndex: number;
    problemStatus: Record<number, { submitCount: number, isAC: boolean }>;
    onGoPrev: () => void;
    onGoNext: () => void;
    onSelectProblem: (id: number) => void;
}

export const ProblemStrip: React.FC<ProblemStripProps> = ({
    problemsList,
    currentProblemIndex,
    problemStatus,
    onGoPrev,
    onGoNext,
    onSelectProblem
}) => {
    if (problemsList.length === 0) return null;

    const getLabel = (index: number) => (index + 1).toString();

    return (
        <div className="tour-problem-strip h-10 bg-[#0f172a] border-b border-white/5 flex items-center justify-center shrink-0 shadow-sm z-40">
            <div className="flex items-center gap-1.5">
                <button
                    onClick={onGoPrev}
                    disabled={currentProblemIndex <= 0}
                    className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${currentProblemIndex <= 0 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                >
                    <CaretLeft weight="bold" />
                </button>
                {problemsList.map((p, idx) => (
                    <button
                        key={p.id}
                        onClick={() => onSelectProblem(p.id)}
                        className={`w-8 h-8 flex items-center justify-center rounded font-semibold text-sm transition-all duration-200 relative ${idx === currentProblemIndex
                            ? 'bg-blue-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.6)] scale-110'
                            : problemStatus[p.id]?.isAC
                                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 hover:bg-emerald-600/30'
                                : (problemStatus[p.id]?.submitCount ?? 0) > 0
                                    ? 'bg-orange-600/20 text-orange-400 border border-orange-600/30 hover:bg-orange-600/30'
                                    : 'bg-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200'
                            }`}
                        title={problemStatus[p.id]?.isAC ? `Câu ${getLabel(idx)} - Đã AC ✓` : (problemStatus[p.id]?.submitCount ?? 0) > 0 ? `Câu ${getLabel(idx)} - Đã nộp (${problemStatus[p.id]?.submitCount}/50)` : `Câu ${getLabel(idx)}`}
                    >
                        {getLabel(idx)}
                        {problemStatus[p.id]?.isAC && idx !== currentProblemIndex && (
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full" />
                        )}
                    </button>
                ))}
                <button
                    onClick={onGoNext}
                    disabled={currentProblemIndex >= problemsList.length - 1}
                    className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${currentProblemIndex >= problemsList.length - 1 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                >
                    <CaretRight weight="bold" />
                </button>
            </div>
        </div>
    );
};
