import { useEffect, useState } from "react";
import { getProblem, Problem } from "../services/problemService";

type Props = {
    problemId: number;
};

export default function ProblemPanel({ problemId }: Props) {
    const [problem, setProblem] = useState<Problem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function fetchProblem() {
            try {
                const data = await getProblem(problemId);
                if (isMounted) setProblem(data);
            } catch {
                if (isMounted) setError("Failed to load problem.");
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
    if (error) return <p className="text-red-400">{error}</p>;
    if (!problem) return null;

    return (
        <div className="h-full overflow-y-auto scroll-smooth p-6 bg-slate-900 text-slate-200">
            <h2 className="text-2xl font-bold mb-4 text-white">
                {problem.title}
            </h2>

            <p className="text-slate-300 leading-relaxed mb-6">
                {problem.description}
            </p>

        </div>
    );
}