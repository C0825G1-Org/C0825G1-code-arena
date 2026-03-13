import { useEffect, useState } from "react";
import { getProblem, getProblemBySlug, Problem } from "../services/problemService";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

type Props = {
    problemId: number;
    problemSlug?: string;
    contestId?: string | null;
    initialData?: Problem;
};

export default function ProblemPanel({ problemId, problemSlug, contestId, initialData }: Props) {
    const [problem, setProblem] = useState<Problem | null>(initialData || null);
    const [loading, setLoading] = useState(!initialData);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (initialData) {
            setProblem(initialData);
            setLoading(false);
            return;
        }

        let isMounted = true;

        async function fetchProblem() {
            setLoading(true);
            try {
                let data: Problem;
                if (problemSlug) {
                    data = await getProblemBySlug(problemSlug);
                } else if (problemId > 0) {
                    data = await getProblem(problemId);
                } else {
                    return;
                }
                if (isMounted) setProblem(data);
            } catch (err: any) {
                if (isMounted) {
                    console.error("Lỗi getProblem:", err);
                    setError(`Failed to load problem. Detail: ${err.message || JSON.stringify(err)}`);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchProblem();

        return () => {
            isMounted = false;
        };
    }, [problemId, problemSlug, initialData]);

    if (loading) return <p className="p-6 text-slate-400 animate-pulse font-mono">Loading problem description...</p>;
    if (error) return <p className="text-red-400 p-4 font-mono text-sm bg-red-500/10 border border-red-500/20 rounded-lg whitespace-pre-wrap">{error}</p>;
    if (!problem) return null;

    return (
        <div className="h-full overflow-y-auto scroll-smooth p-6 text-slate-200 custom-scrollbar">
            {contestId && (
                <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-black tracking-wide uppercase shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                    <span className="animate-pulse">🔴</span> Đang Trong Khảo Thí
                </div>
            )}
            {/* Ẩn tiêu đề bài tập lặp lại vì đã có trên Breadcrumb */}
            {/* <h2 className="text-2xl font-bold mb-6 text-white border-b border-slate-800 pb-4">
                {problem.title}
            </h2> */}

            <div className="prose-markdown">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                >
                    {problem.description}
                </ReactMarkdown>
            </div>
        </div>
    );
}
