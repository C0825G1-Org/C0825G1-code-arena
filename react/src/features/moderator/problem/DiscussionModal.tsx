import React from 'react';
import { X } from '@phosphor-icons/react';
import { ProblemDiscussionPanel } from '../../user/code-editor/components/ProblemDiscussionPanel';

interface DiscussionModalProps {
    isOpen: boolean;
    onClose: () => void;
    problemId: number | null;
    problemTitle: string | null;
}

export const DiscussionModal = ({ isOpen, onClose, problemId, problemTitle }: DiscussionModalProps) => {
    if (!isOpen || !problemId) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-[#1e293b] w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl border border-slate-700/50 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-[#0f172a]/50">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            Thảo luận bài tập #{problemId}
                        </h3>
                        <p className="text-xs text-slate-400 truncate max-w-md">{problemTitle}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={20} weight="bold" />
                    </button>
                </div>

                {/* Discussion Panel Integration */}
                <div className="flex-1 overflow-hidden">
                    <ProblemDiscussionPanel problemId={problemId} />
                </div>
            </div>
        </div>
    );
};
