import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Code, Tag, Hash, FileText } from '@phosphor-icons/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Link } from 'react-router-dom';
import axiosClient from '../../../../shared/services/axiosClient';
import { toast } from 'react-hot-toast';

interface TagDTO {
    id: number;
    name: string;
}

interface ProblemDetailDTO {
    id: number;
    title: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    tags: TagDTO[];
}

interface ProblemDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    problemId: number | null;
    userStatus: 'SOLVED' | 'ATTEMPTED' | 'UNATTEMPTED' | null;
}

export const ProblemDetailModal: React.FC<ProblemDetailModalProps> = ({ isOpen, onClose, problemId, userStatus }) => {
    const [problem, setProblem] = useState<ProblemDetailDTO | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && problemId) {
            fetchProblemDetail();
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        } else {
            setProblem(null);
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, problemId]);

    const fetchProblemDetail = async () => {
        try {
            setLoading(true);
            const response = await axiosClient.get(`/problems/${problemId}`);
            setProblem(response as any);
        } catch (error) {
            console.error('Lỗi khi lấy chi tiết bài tập:', error);
            toast.error('Không thể lấy nội dung bài tập.');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const renderDifficulty = (diff: string) => {
        switch (diff.toLowerCase()) {
            case 'easy':
                return <span className="text-green-400 font-medium capitalize bg-green-500/10 px-2.5 py-1 rounded-full text-xs border border-green-500/20">{diff}</span>;
            case 'medium':
                return <span className="text-yellow-400 font-medium capitalize bg-yellow-500/10 px-2.5 py-1 rounded-full text-xs border border-yellow-500/20">{diff}</span>;
            case 'hard':
                return <span className="text-red-400 font-medium capitalize bg-red-500/10 px-2.5 py-1 rounded-full text-xs border border-red-500/20">{diff}</span>;
            default:
                return <span className="text-slate-400 font-medium capitalize">{diff}</span>;
        }
    };

    return createPortal(
        <div 
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm px-4 py-8 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col h-fit max-h-[90vh] overflow-hidden transform transition-all relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                            <FileText weight="duotone" className="text-2xl" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white leading-tight">
                                {loading ? 'Đang tải...' : (problem ? `${problem.id}. ${problem.title}` : 'Theo tác không tồn tại')}
                            </h2>
                            {problem && (
                                <div className="flex items-center gap-3 mt-2">
                                    {renderDifficulty(problem.difficulty)}
                                    <div className="flex gap-1.5 flex-wrap">
                                        {problem.tags.length > 0 ? problem.tags.map(tag => (
                                            <span key={tag.id} className="text-slate-400 text-xs px-2 py-1 bg-slate-800 rounded-full border border-slate-700 flex items-center gap-1">
                                                <Tag weight="fill" className="text-slate-500 text-[10px]" />
                                                {tag.name}
                                            </span>
                                        )) : (
                                            <span className="text-slate-500 text-xs italic">Không có thẻ</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        <X weight="bold" className="text-xl" />
                    </button>
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : problem ? (
                        <div className="prose-markdown max-w-none">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm, remarkMath]}
                                rehypePlugins={[rehypeRaw, rehypeKatex]}
                                components={{
                                    code({ node, inline, className, children, ...props }: any) {
                                        const match = /language-(\w+)/.exec(className || '');
                                        return !inline && match ? (
                                            <SyntaxHighlighter
                                                style={vscDarkPlus as any}
                                                language={match[1]}
                                                PreTag="div"
                                                className="rounded-xl border border-slate-700 my-4 text-sm !bg-slate-900/50"
                                                {...props}
                                            >
                                                {String(children).replace(/\n$/, '')}
                                            </SyntaxHighlighter>
                                        ) : (
                                            <code className="bg-slate-800 text-blue-300 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                                                {children}
                                            </code>
                                        );
                                    }
                                }}
                            >
                                {problem.description || '*Không có mô tả*'}
                            </ReactMarkdown>
                        </div>
                    ) : (
                        <div className="text-center text-slate-500 py-10">
                            Không tìm thấy dữ liệu.
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex justify-end gap-3 items-center backdrop-blur-md">
                    <button 
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 font-medium transition-colors"
                    >
                        Đóng
                    </button>
                    {problem && (
                         <Link 
                            to={`/code-editor/${problem.id}`} 
                            className={`flex items-center gap-2 px-6 py-2 rounded-xl shadow-lg transition-all font-bold ${
                                userStatus === 'SOLVED' 
                                ? 'bg-slate-700 hover:bg-slate-600 text-white shadow-slate-900/20 border border-slate-600'
                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/30 border border-blue-500'
                            }`}
                        >
                            <Code weight="bold" />
                            {userStatus === 'SOLVED' ? 'Làm lại' : 'Giải bài'}
                        </Link>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};
