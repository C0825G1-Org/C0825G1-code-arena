import { useEffect, useState } from "react";
import { getProblem, Problem } from "../../../services/user/code-editor/problemService";

export default function ProblemPanel() {
    const [problem, setProblem] = useState<Problem | null>(null);

    useEffect(() => {
        getProblem(1).then(setProblem);
    }, []);

    if (!problem) return <p>Loading problem...</p>;

    return (
        <div className="h-full overflow-y-auto p-6 bg-slate-900 text-slate-200">
            <h2 className="text-2xl font-bold mb-4 text-white">{problem.title}</h2>
            <p className="text-slate-300 leading-relaxed mb-6">{problem.description}</p>

            <div className="space-y-6">
                <div>
                    <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Sample Input</h4>
                    <pre className="bg-slate-800 p-4 rounded-md border border-slate-700 text-slate-300 font-mono text-sm overflow-x-auto">
                        {problem.sampleInput}
                    </pre>
                </div>

                <div>
                    <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Sample Output</h4>
                    <pre className="bg-slate-800 p-4 rounded-md border border-slate-700 text-slate-300 font-mono text-sm overflow-x-auto">
                        {problem.sampleOutput}
                    </pre>
                </div>
            </div>
        </div>
    );
}