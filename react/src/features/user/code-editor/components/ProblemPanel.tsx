import { useEffect, useState } from "react";
import { getProblem, Problem } from "../services/problemService";

type Props = {
    problemId: number;
    contestId?: string | null;
};

export default function ProblemPanel({ problemId, contestId }: Props) {
    const [problem, setProblem] = useState<Problem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function fetchProblem() {
            try {
                const data = await getProblem(problemId);
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
    }, [problemId]);

    if (loading) return <p>Loading problem...</p>;
    if (error) return <p className="text-red-400 p-4 font-mono text-sm bg-red-500/10 border border-red-500/20 rounded-lg whitespace-pre-wrap">{error}</p>;
    if (!problem) return null;

    return (
        <div className="h-full overflow-y-auto scroll-smooth p-6 bg-slate-900 text-slate-200">
            {contestId && (
                <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-sm font-black tracking-wide uppercase shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                    <span className="animate-pulse">🔴</span> Đang Trong Khảo Thí
                </div>
            )}
            <h2 className="text-2xl font-bold mb-4 text-white">
                {problem.title}
            </h2>

            <p className="text-slate-300 leading-relaxed mb-6">
                {problem.description}
            </p>

        </div>
    );
}