import React from 'react';
import { X, Info, Clock, HardDrive, Tag, Trophy } from '@phosphor-icons/react';
import { ProblemResponseDTO } from '../../services/problemApi';

interface ProblemDetailSubModalProps {
    isOpen: boolean;
    onClose: () => void;
    problem: ProblemResponseDTO | null;
}

export const ProblemDetailSubModal = ({ isOpen, onClose, problem }: ProblemDetailSubModalProps) => {
    if (!isOpen || !problem) return null;

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty.toLowerCase()) {
            case 'easy': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'hard': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
            default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-in">
                <div className="flex justify-between items-center p-4 border-b border-slate-700/50 bg-slate-800/80">
                    <h4 className="text-lg font-bold text-white flex items-center gap-2">
                        <Info weight="duotone" className="text-blue-400" />
                        Chi Tiết Bài Tập
                    </h4>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-700/50 hover:bg-slate-600/50 p-1.5 rounded-lg text-sm">
                        <X weight="bold" />
                    </button>
                </div>

                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Header Info */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-mono text-slate-500">#{problem.id}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getDifficultyColor(problem.difficulty)}`}>
                                {problem.difficulty}
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-white leading-tight">{problem.title}</h3>
                    </div>

                    {/* Limits & Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
                            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                                <Clock className="text-blue-400" />
                                Giới hạn thời gian
                            </div>
                            <div className="text-white font-semibold">{problem.timeLimit} ms</div>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
                            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                                <HardDrive className="text-purple-400" />
                                Giới hạn bộ nhớ
                            </div>
                            <div className="text-white font-semibold">{problem.memoryLimit} MB</div>
                        </div>
                    </div>

                    {/* Tags */}
                    {problem.tags && problem.tags.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                                <Tag className="text-emerald-400" />
                                Chủ đề / Tags
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {problem.tags.map(tag => (
                                    <span key={tag.id} className="px-2 py-1 bg-slate-700/50 text-slate-300 rounded text-xs border border-slate-600/30">
                                        {tag.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    <div>
                        <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                            <Trophy className="text-amber-400" />
                            Mô tả bài tập
                        </div>
                        <div className="bg-slate-900/30 rounded-lg p-4 text-slate-300 text-sm leading-relaxed border border-slate-700/30 italic">
                            {problem.description || "Không có mô tả chi tiết."}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-700/50 bg-slate-900/20 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};
