import React from 'react';
import axios from 'axios';
import TestCaseItem from './TestCaseItem';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../app/store';

interface SubmissionDetailPanelProps {
    submissionId: number | null;
    onClose: () => void;
}

const SubmissionDetailPanel: React.FC<SubmissionDetailPanelProps> = ({ submissionId, onClose }) => {
    const { token } = useSelector((state: RootState) => state.auth);
    const [data, setData] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!submissionId) {
            setData(null);
            return;
        }

        const fetchDetail = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get(`http://localhost:8080/api/submissions/${submissionId}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                });
                setData(response.data);
            } catch (err: any) {
                console.error("Lỗi khi lấy chi tiết bài nộp:", err);
                setError(err.response?.data?.message || "Không thể tải chi tiết bài nộp.");
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
    }, [submissionId, token]);

    if (!submissionId) return null;

    return (
        <div className={`fixed inset-y-0 right-0 w-full md:w-[600px] bg-slate-900 border-l border-slate-700 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${submissionId ? 'translate-x-0' : 'translate-x-full'}`}>
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

            {loading ? (
                <div className="flex-1 flex items-center justify-center text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>Đang tải dữ liệu...</span>
                    </div>
                </div>
            ) : error ? (
                <div className="flex-1 flex items-center justify-center p-6 text-center">
                    <div className="text-red-400">
                        <div className="text-4xl mb-2">⚠️</div>
                        <p>{error}</p>
                    </div>
                </div>
            ) : data ? (
                <>
                    {/* Summary Banner */}
                    <div className={`p-4 ${data.status === 'AC' ? 'bg-green-900/30 border-b border-green-800' : 'bg-red-900/30 border-b border-red-800'}`}>
                        <div className="flex justify-between items-center">
                            <div>
                                <div className={`text-2xl font-black flex items-center gap-3 ${data.status === 'AC' ? 'text-green-500' : 'text-red-500'}`}>
                                    {data.status}
                                    {data.isTestRun && <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded font-normal">CHẠY THỬ</span>}
                                </div>
                                <div className="text-slate-300 mt-1">Điểm số: <span className="font-bold text-white">{data.score} / 100</span></div>
                            </div>
                            <div className="text-right text-sm text-slate-400 space-y-1">
                                <div>⏳ Time: <span className="text-slate-200">{data.executionTime}ms</span></div>
                                <div>💾 RAM: <span className="text-slate-200">{data.memoryUsed}KB</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Source Code Section */}
                    <div className="p-4 border-b border-slate-700 bg-slate-800/50">
                        <h3 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">Mã nguồn đã nộp</h3>
                        <pre className="bg-slate-950 p-3 rounded text-xs overflow-x-auto text-blue-300 font-mono max-h-40 border border-slate-800">
                            <code>{data.sourceCode}</code>
                        </pre>
                    </div>

                    {/* Test Cases List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        <h3 className="text-slate-300 font-semibold mb-3">Danh sách Test Cases ({data.testCaseResults?.length || 0})</h3>
                        {data.testCaseResults?.map((tc, idx) => (
                            <TestCaseItem
                                key={tc.id || idx}
                                index={idx + 1}
                                status={tc.status}
                                executionTime={tc.executionTime}
                                memoryUsed={tc.memoryUsed}
                                isHidden={!tc.isSample}
                                isCompileError={tc.status === 'CE'}
                                input={tc.input}
                                expectedOutput={tc.expectedOutput}
                                actualOutput={tc.actualOutput}
                            />
                        ))}
                    </div>
                </>
            ) : null}
        </div>
    );
};

export default SubmissionDetailPanel;
