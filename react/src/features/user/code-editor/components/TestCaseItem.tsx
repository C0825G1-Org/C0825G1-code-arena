import React, { useState } from 'react';

interface TestCaseItemProps {
    index: number;
    status: string;
    executionTime: number;
    memoryUsed: number;
    isHidden: boolean;
    isCompileError: boolean;
    errorMessage?: string;
    input?: string;
    expectedOutput?: string;
    actualOutput?: string;
    score?: number;
    scoreWeight?: number;
}

const TestCaseItem: React.FC<TestCaseItemProps> = React.memo(({
    index,
    status,
    executionTime,
    memoryUsed,
    isHidden,
    isCompileError,
    errorMessage,
    input,
    expectedOutput,
    actualOutput,
    score = 0,
    scoreWeight = 0
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const getStatusColor = (st: string) => {
        switch (st) {
            case 'AC': return 'text-green-500';
            case 'WA': return 'text-red-500';
            case 'TLE': return 'text-yellow-500';
            case 'MLE': return 'text-orange-500';
            case 'CE': return 'text-purple-500';
            case 'RE': return 'text-pink-500';
            default: return 'text-slate-400';
        }
    };

    const getStatusIcon = (st: string) => {
        switch (st) {
            case 'AC': return '✅';
            case 'WA': return '❌';
            case 'TLE': return '⏱️';
            case 'MLE': return '💾';
            case 'CE': return '🛠️';
            case 'RE': return '⚠️';
            default: return '⚙️';
        }
    };

    return (
        <div className="border border-slate-700 bg-slate-800 rounded-md mb-2 overflow-hidden">
            <div
                className="flex justify-between items-center p-3 cursor-pointer hover:bg-slate-700 transition"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3">
                    <span className="text-lg">{getStatusIcon(status)}</span>
                    <span className={`font-semibold ${getStatusColor(status)}`}>
                        Test Case {index} {isHidden ? '(Hidden)' : '(Sample)'}
                    </span>
                    <span className={`font-bold ml-2 ${getStatusColor(status)}`}>{status}</span>
                </div>
                <div className="text-slate-400 text-sm flex gap-4 items-center">
                    <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-700 text-amber-400 font-bold">
                        {score} / {scoreWeight} pts
                    </span>
                    <span>⏱️ {executionTime != null ? `${executionTime}ms` : '- ms'}</span>
                    <span>💾 {memoryUsed != null ? `${memoryUsed}KB` : '- KB'}</span>
                    <span className="text-xl">{isOpen ? '▾' : '▸'}</span>
                </div>
            </div>

            {isOpen && (
                <div className="p-4 border-t border-slate-700 bg-slate-900 text-sm">
                    {isHidden ? (
                        <div className="text-slate-400 italic text-center py-4">
                            🔒 Test case bị ẩn để bảo mật kỳ thi.
                        </div>
                    ) : isCompileError ? (
                        <div>
                            <div className="text-red-400 mb-2 font-semibold">Gặp lỗi (Compile/Runtime Error):</div>
                            <pre className="bg-black text-red-500 p-3 rounded font-mono overflow-auto text-xs border border-red-900">
                                {errorMessage || 'Không có log lỗi chi tiết.'}
                            </pre>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <div className="text-slate-400 mb-1 font-semibold">Input:</div>
                                <pre className="bg-black p-2 rounded text-slate-300 overflow-auto max-h-40">{input || 'N/A'}</pre>
                            </div>
                            <div>
                                <div className="text-slate-400 mb-1 font-semibold">Expected Output:</div>
                                <pre className="bg-black p-2 rounded text-slate-300 overflow-auto max-h-40">{expectedOutput || 'N/A'}</pre>
                            </div>
                            <div>
                                <div className="text-slate-400 mb-1 font-semibold">Your Output:</div>
                                <pre className={`bg-black p-2 rounded overflow-auto max-h-40 ${status === 'AC' ? 'text-green-400' : 'text-red-400'}`}>
                                    {actualOutput || 'N/A'}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});

export default TestCaseItem;
