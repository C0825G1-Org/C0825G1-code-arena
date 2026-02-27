import React from 'react';
import TestCaseItem from './TestCaseItem';

interface SubmissionDetailPanelProps {
    submissionId: number | null;
    onClose: () => void;
}

const SubmissionDetailPanel: React.FC<SubmissionDetailPanelProps> = ({ submissionId, onClose }) => {
    // 🚧 TODO: Fetch data API detail của bài nộp dựa vào submissionId
    // Tạm thời Fake Data để test giao diện theo đúng yêu cầu Ngày 4

    if (!submissionId) return null;

    const mockData = {
        id: submissionId,
        status: 'WA',
        score: 66,
        maxTime: 45,
        maxMemory: 12,
        testCases: [
            { id: 1, status: 'AC', time: 10, mem: 5, isHidden: false, isCE: false, input: "2 3", expected: "5", actual: "5" },
            { id: 2, status: 'AC', time: 12, mem: 6, isHidden: false, isCE: false, input: "10 20", expected: "30", actual: "30" },
            { id: 3, status: 'WA', time: 45, mem: 12, isHidden: true, isCE: false }
        ]
    };

    return (
        <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-slate-900 border-l border-slate-700 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-800">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    📄 Chi tiết Bài Nộp #{submissionId}
                </h2>
                <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-white transition rounded-full p-1 hover:bg-slate-700 text-2xl leading-none"
                >
                    &times;
                </button>
            </div>

            {/* Summary Banner */}
            <div className={`p-4 ${mockData.status === 'AC' ? 'bg-green-900/30 border-b border-green-800' : 'bg-red-900/30 border-b border-red-800'}`}>
                <div className="flex justify-between items-center">
                    <div>
                        <div className={`text-2xl font-black ${mockData.status === 'AC' ? 'text-green-500' : 'text-red-500'}`}>
                            {mockData.status}
                        </div>
                        <div className="text-slate-300 mt-1">Điểm số: <span className="font-bold text-white">{mockData.score} / 100</span></div>
                    </div>
                    <div className="text-right text-sm text-slate-400 space-y-1">
                        <div>⏳ Time Max: <span className="text-slate-200">{mockData.maxTime}ms</span></div>
                        <div>💾 RAM Max: <span className="text-slate-200">{mockData.maxMemory}MB</span></div>
                    </div>
                </div>
            </div>

            {/* Test Cases List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <h3 className="text-slate-300 font-semibold mb-3">Danh sách Test Cases ({mockData.testCases.length})</h3>
                {mockData.testCases.map((tc, idx) => (
                    <TestCaseItem
                        key={tc.id}
                        index={idx + 1}
                        status={tc.status}
                        executionTime={tc.time}
                        memoryUsed={tc.mem}
                        isHidden={tc.isHidden}
                        isCompileError={tc.isCE}
                        input={tc.input}
                        expectedOutput={tc.expected}
                        actualOutput={tc.actual}
                    />
                ))}
            </div>
        </div>
    );
};

export default SubmissionDetailPanel;
