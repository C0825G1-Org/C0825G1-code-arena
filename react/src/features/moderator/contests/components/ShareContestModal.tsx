import React, { useState } from 'react';
import { X, ShareNetwork, Copy, Check } from '@phosphor-icons/react';
import { toast } from 'react-hot-toast';

interface ShareContestModalProps {
    isOpen: boolean;
    onClose: () => void;
    contestId: number | null;
    contestTitle: string;
}

export const ShareContestModal = ({ isOpen, onClose, contestId, contestTitle }: ShareContestModalProps) => {
    const [copied, setCopied] = useState(false);

    if (!isOpen || !contestId) return null;

    const shareUrl = `${window.location.origin}/contests/${contestId}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            toast.success('Đã sao chép liên kết vào bộ nhớ tạm!');
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast.error('Không thể sao chép liên kết.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-slide-up">
                <div className="flex justify-between items-center p-5 border-b border-slate-700/50 bg-slate-800/80">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <ShareNetwork weight="fill" className="text-blue-500" />
                        Chia sẻ cuộc thi
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-700/50 hover:bg-slate-600/50 p-1.5 rounded-lg">
                        <X weight="bold" />
                    </button>
                </div>
                <div className="p-6">
                    <p className="text-slate-300 text-sm mb-4">
                        Chia sẻ liên kết này để mời người khác tham gia cuộc thi <strong className="text-white">{contestTitle}</strong>:
                    </p>
                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl p-1 pl-3 overflow-hidden">
                        <span className="text-slate-400 text-sm truncate flex-1 font-mono">
                            {shareUrl}
                        </span>
                        <button
                            onClick={handleCopy}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                copied 
                                ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                            }`}
                        >
                            {copied ? <Check weight="bold" /> : <Copy weight="bold" />}
                            {copied ? 'Đã chép' : 'Sao chép'}
                        </button>
                    </div>
                </div>
                <div className="flex justify-end p-5 border-t border-slate-700/50 bg-slate-900/30">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors border border-slate-600/50"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};
