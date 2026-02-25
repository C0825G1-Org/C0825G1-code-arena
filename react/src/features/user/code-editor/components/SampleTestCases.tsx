import React from "react";

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
    if (!testCases || testCases.length === 0) {
        return <div style={{ padding: 16 }}>No sample test cases available.</div>;
    }

    return (
        <div className="h-full overflow-y-auto p-4 bg-slate-900 border-t border-slate-800">
            <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Sample Test Cases</h4>
            <div className="space-y-4">
                {testCases.map((tc, index) => (
                    <div key={tc.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                        <strong className="text-slate-300 text-sm mb-3 block">Case {index + 1}:</strong>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Input</label>
                                <textarea
                                    readOnly
                                    value={tc.input}
                                    className="w-full min-h-[80px] bg-slate-900/50 text-slate-300 font-mono text-sm p-3 rounded border border-slate-700 focus:outline-none focus:border-slate-500 resize-none transition-colors"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Output</label>
                                <textarea
                                    readOnly
                                    value={tc.output}
                                    className="w-full min-h-[80px] bg-slate-900/50 text-slate-300 font-mono text-sm p-3 rounded border border-slate-700 focus:outline-none focus:border-slate-500 resize-none transition-colors"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
