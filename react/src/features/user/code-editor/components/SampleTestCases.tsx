export type TestCase = {
    id: number;
    problemId: number;
    input: string;
    output: string;
    is_sample: boolean;
};

type Props = {
    testCases: TestCase[];
};
export default function SampleTestCases({ testCases }: Props) {
    const sampleCases = testCases.filter(tc => tc.is_sample);

    if (sampleCases.length === 0) {
        return (
            <div className="p-4 text-slate-400">
                No sample test cases available.
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-4 bg-slate-900 border-t border-slate-800">
            <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Sample Test Cases
            </h4>

            <div className="space-y-4">
                {sampleCases.map((tc, index) => (
                    <div
                        key={tc.id}
                        className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50"
                    >
                        <strong className="text-slate-300 text-sm mb-3 block">
                            Case {index + 1}
                        </strong>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                    Input
                                </p>
                                <pre className="bg-slate-900/50 text-slate-300 font-mono text-sm p-3 rounded border border-slate-700 whitespace-pre-wrap max-h-48 overflow-auto">
                                    {tc.input}
                                </pre>
                            </div>

                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                    Output
                                </p>
                                <pre className="bg-slate-900/50 text-slate-300 font-mono text-sm p-3 rounded border border-slate-700 whitespace-pre-wrap max-h-48 overflow-auto">
                                    {tc.output}
                                </pre>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}