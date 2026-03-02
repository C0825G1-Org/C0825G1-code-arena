import { useState, useEffect } from 'react';
import { useSocket } from '../../../../shared/hooks/useSocket';
import { TestCase } from '../services/problemService';
import { CheckCircle, XCircle, Clock, WarningCircle } from '@phosphor-icons/react';

type TestCaseResult = {
    id: number;
    status: string;
    isSample: boolean;
    input?: string;
    expectedOutput?: string;
    actualOutput?: string;
    executionTime?: number;
};

type RunResult = {
    isRunOnly: boolean;
    status: string;
    executionTime?: number;
    memoryUsed?: number;
    testCaseResults?: TestCaseResult[];
};

type Props = {
    testCases: TestCase[];
};

type PanelTab = 'testcase' | 'result';

export default function SampleTestCases({ testCases }: Props) {
    const sampleCases = testCases.filter(tc => tc.isSample);
    const [panelTab, setPanelTab] = useState<PanelTab>('testcase');
    const [activeCase, setActiveCase] = useState(0);
    const [activeResultCase, setActiveResultCase] = useState(0);
    const [runResult, setRunResult] = useState<RunResult | null>(null);
    const [isRunning, setIsRunning] = useState(false);

    useSocket((data: any) => {
        if (data.status === 'judging' && data.isRunOnly) {
            setIsRunning(true);
            setRunResult(null);
            setPanelTab('result');
        }
        if (data.isRunOnly === true && data.status !== 'judging' && data.status !== 'pending') {
            setIsRunning(false);
            setRunResult(data);
            setActiveResultCase(0);
            setPanelTab('result');
        }
    });

    // Reset khi đổi bài
    useEffect(() => {
        setRunResult(null);
        setIsRunning(false);
        setActiveCase(0);
        setActiveResultCase(0);
        setPanelTab('testcase');
    }, [testCases]);

    const sampleResults = runResult?.testCaseResults?.filter(r => r.isSample) ?? [];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'AC':
                return <span className="flex items-center gap-1.5 text-green-400 font-bold text-base"><CheckCircle size={18} weight="fill" />Accepted</span>;
            case 'WA':
                return <span className="flex items-center gap-1.5 text-red-400 font-bold text-base"><XCircle size={18} weight="fill" />Wrong Answer</span>;
            case 'TLE':
                return <span className="flex items-center gap-1.5 text-orange-400 font-bold text-base"><Clock size={18} weight="fill" />Time Limit Exceeded</span>;
            case 'CE':
                return <span className="flex items-center gap-1.5 text-purple-400 font-bold text-base"><WarningCircle size={18} weight="fill" />Compile Error</span>;
            case 'MLE':
                return <span className="flex items-center gap-1.5 text-yellow-400 font-bold text-base"><WarningCircle size={18} weight="fill" />Memory Limit Exceeded</span>;
            default:
                return <span className="text-slate-400 font-bold text-base">{status}</span>;
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#1e293b] overflow-hidden">

            {/* ─── Top Tab Bar ─── */}
            <div className="flex items-center border-b border-white/5 bg-[#0f172a]/60 px-4 gap-0">
                <button
                    onClick={() => setPanelTab('testcase')}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${panelTab === 'testcase'
                        ? 'border-blue-400 text-white'
                        : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                >
                    Testcase
                </button>
                <button
                    onClick={() => setPanelTab('result')}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${panelTab === 'result'
                        ? 'border-green-400 text-white'
                        : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                >
                    Test Result
                    {isRunning && <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />}
                    {!isRunning && runResult && (
                        <div className={`w-2 h-2 rounded-full ${runResult.status === 'AC' ? 'bg-green-400' : 'bg-red-400'}`} />
                    )}
                </button>
            </div>

            {/* ─── Testcase Tab ─── */}
            {panelTab === 'testcase' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Select case tabs */}
                    <div className="flex items-center gap-2 px-4 pt-3 pb-2 flex-wrap">
                        {sampleCases.length === 0 ? (
                            <span className="text-slate-500 text-sm">Không có test case mẫu.</span>
                        ) : (
                            sampleCases.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveCase(idx)}
                                    className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${activeCase === idx
                                        ? 'bg-[#2d3f55] text-white border border-blue-500/40'
                                        : 'bg-[#0f172a]/60 text-slate-400 hover:text-slate-200 border border-white/5'}`}
                                >
                                    Case {idx + 1}
                                </button>
                            ))
                        )}
                    </div>

                    {/* Case content */}
                    {sampleCases[activeCase] && (
                        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Input</p>
                                <pre className="bg-[#0f172a] text-slate-200 font-mono text-sm p-3 rounded-lg border border-white/5 whitespace-pre-wrap">{sampleCases[activeCase].sampleInput}</pre>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Expected Output</p>
                                <pre className="bg-[#0f172a] text-slate-200 font-mono text-sm p-3 rounded-lg border border-white/5 whitespace-pre-wrap">{sampleCases[activeCase].sampleOutput}</pre>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ─── Test Result Tab ─── */}
            {panelTab === 'result' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Running state */}
                    {isRunning && (
                        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-400">
                            <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm font-medium">Đang chạy code...</p>
                        </div>
                    )}

                    {/* Empty state */}
                    {!isRunning && !runResult && (
                        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-500">
                            <Clock size={36} />
                            <p className="text-sm">Bấm <strong className="text-slate-300">Chạy thử</strong> để xem kết quả</p>
                        </div>
                    )}

                    {/* Results */}
                    {!isRunning && runResult && (
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Status banner */}
                            <div className={`px-4 py-3 border-b ${runResult.status === 'AC'
                                ? 'border-green-500/20 bg-green-500/5'
                                : 'border-red-500/20 bg-red-500/5'}`}>
                                <div className="flex items-center justify-between">
                                    {getStatusBadge(runResult.status)}
                                    {(runResult.executionTime != null || runResult.memoryUsed != null) && (
                                        <div className="flex gap-4 text-xs text-slate-500 font-medium">
                                            {runResult.executionTime != null && <span>⏱ {runResult.executionTime} ms</span>}
                                            {runResult.memoryUsed != null && <span>💾 {runResult.memoryUsed} MB</span>}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {sampleResults.length > 0 && (
                                <>
                                    {/* Case selector tabs with pass/fail dots */}
                                    <div className="flex items-center gap-2 px-4 pt-3 pb-2 flex-wrap border-b border-white/5">
                                        {sampleResults.map((r, idx) => {
                                            const passed = r.status === 'AC';
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => setActiveResultCase(idx)}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${activeResultCase === idx
                                                        ? 'bg-[#2d3f55] text-white border border-white/20'
                                                        : 'bg-[#0f172a]/60 text-slate-400 hover:text-slate-200 border border-white/5'}`}
                                                >
                                                    <div className={`w-2 h-2 rounded-full ${passed ? 'bg-green-400' : 'bg-red-400'}`} />
                                                    Case {idx + 1}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Case detail */}
                                    {sampleResults[activeResultCase] && (() => {
                                        const r = sampleResults[activeResultCase];
                                        const passed = r.status === 'AC';
                                        return (
                                            <div className="flex-1 overflow-y-auto px-4 pb-4 pt-3 space-y-4">
                                                {r.input != null && (
                                                    <div>
                                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Input</p>
                                                        <pre className="bg-[#0f172a] text-slate-200 font-mono text-sm p-3 rounded-lg border border-white/5 whitespace-pre-wrap">{r.input}</pre>
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Output</p>
                                                    <pre className={`font-mono text-sm p-3 rounded-lg border whitespace-pre-wrap ${passed
                                                        ? 'bg-[#0f172a] text-slate-200 border-white/5'
                                                        : 'bg-red-950/30 text-red-300 border-red-500/20'}`}>
                                                        {r.actualOutput ?? '(trống)'}
                                                    </pre>
                                                </div>
                                                {!passed && (
                                                    <div>
                                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Expected</p>
                                                        <pre className="bg-[#0f172a] text-green-300 font-mono text-sm p-3 rounded-lg border border-green-500/20 whitespace-pre-wrap">{r.expectedOutput ?? '?'}</pre>
                                                    </div>
                                                )}
                                                {r.executionTime != null && (
                                                    <p className="text-xs text-slate-600">Runtime: {r.executionTime} ms</p>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </>
                            )}

                            {sampleResults.length === 0 && (
                                <div className="flex-1 flex items-center justify-center">
                                    <p className="text-slate-500 text-sm">Không có kết quả test case mẫu.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}