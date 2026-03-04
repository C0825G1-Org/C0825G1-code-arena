import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSocket } from '../../../../shared/hooks/useSocket';
import { CheckCircle, Clock, WarningCircle, XCircle } from '@phosphor-icons/react';
import SubmissionDetailPanel from './SubmissionDetailPanel';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../app/store';

const SubmissionHistory = ({ problemId, contestId }: { problemId: number, contestId?: string | null }) => {
    const { token } = useSelector((state: RootState) => state.auth);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);

    // Initial load
    useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                let apiUrl = `http://localhost:8080/api/submissions/me?problemId=${problemId}`;
                if (contestId) {
                    apiUrl += `&contestId=${contestId}`;
                }

                const response = await axios.get(apiUrl, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                });
                if (response.data && response.data.content) {
                    setSubmissions(response.data.content.slice(0, 10)); // Lấy 10 bài gần nhất
                } else if (Array.isArray(response.data)) {
                    setSubmissions(response.data.slice(0, 10));
                }
            } catch (error) {
                console.error('Lỗi khi fetch lịch sử nộp bài:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSubmissions();
    }, [problemId, contestId, token]);

    // Socket listener for real-time updates
    useSocket((data) => {
        // data = { submissionId, status, executionTime, memoryUsed, score }
        console.log('Submission update received in History:', data);

        // Cập nhật âm thanh nếu AC
        if (data.status === 'AC') {
            try {
                // new Audio('/ting.mp3').play();
            } catch (e) {
                // Ignore audio error if file not found
            }
        }

        setSubmissions((prev: any[]) => {
            // Filter out updates not meant for this contest view
            if (contestId && data.contestId !== Number(contestId)) {
                return prev;
            }

            // Check if submission already exists in list (update it)
            const existsIndex = prev.findIndex(s => s.id === data.submissionId || s.submissionId === data.submissionId);
            if (existsIndex >= 0) {
                const newSubmissions = [...prev];
                newSubmissions[existsIndex] = { ...newSubmissions[existsIndex], ...data, id: data.submissionId };
                return newSubmissions;
            }
            // Add new to top
            // Gán isTestRun từ data.isRunOnly nếu có
            const isTestRun = data.isRunOnly === true;
            return [{ ...data, id: data.submissionId, isTestRun, createdAt: new Date().toISOString() }, ...prev];
        });
    });

    const getStatusUI = (status) => {
        switch (status) {
            case 'pending':
                return <span className="text-yellow-500 flex items-center gap-1"><Clock size={16} /> Đang chờ</span>;
            case 'judging':
                return <span className="text-blue-400 flex items-center gap-1"><div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div> Đang chấm</span>;
            case 'AC':
                return <span className="text-green-500 flex items-center gap-1"><CheckCircle size={16} weight="fill" /> Đã duyệt (AC)</span>;
            case 'WA':
                return <span className="text-red-500 flex items-center gap-1"><XCircle size={16} weight="fill" /> Sai kết quả (WA)</span>;
            case 'TLE':
                return <span className="text-orange-500 flex items-center gap-1"><Clock size={16} weight="fill" /> Quá thời gian (TLE)</span>;
            case 'MLE':
                return <span className="text-red-400 flex items-center gap-1"><WarningCircle size={16} weight="fill" /> Tràn bộ nhớ (MLE)</span>;
            case 'CE':
                return <span className="text-purple-500 flex items-center gap-1"><WarningCircle size={16} weight="fill" /> Lỗi biên dịch (CE)</span>;
            default:
                return <span className="text-slate-400">{status}</span>;
        }
    };

    if (loading) return <div className="p-4 text-center text-slate-400">Đang tải lịch sử...</div>;

    return (
        <div className="flex flex-col h-full text-slate-300 p-6 overflow-y-auto scroll-smooth">
            <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-3 flex items-center gap-2">
                <Clock size={24} className="text-blue-400" />
                Lịch sử nộp bài
            </h3>
            {submissions.length === 0 ? (
                <div className="text-center text-slate-500 mt-10 flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                        <Clock size={32} />
                    </div>
                    Chưa có bài nộp nào.
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {submissions.map((sub, index) => (
                        <div
                            key={sub.id || index}
                            className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 ${sub.isTestRun || sub.isRunOnly ? 'bg-[#1e293b]/50 border-dashed border-slate-600 hover:bg-[#1e293b]/70 hover:border-slate-400' : 'bg-[#1e293b] border-white/5 hover:border-white/20'}`}
                            onClick={() => setSelectedSubmissionId(sub.id || sub.submissionId)}
                        >
                            <div className="flex justify-between items-center mb-3">
                                <span className="font-semibold flex items-center gap-2">
                                    {(sub.isTestRun || sub.isRunOnly) && <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Chạy thử</span>}
                                    {getStatusUI(sub.status)}
                                </span>
                                <span className="text-xs font-medium text-slate-500 bg-black/20 px-2 py-1 rounded-full">
                                    {sub.createdAt ? new Date(sub.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Vừa xong'}
                                </span>
                            </div>
                            {(sub.status === 'AC' || sub.status === 'WA' || sub.status === 'TLE' || sub.status === 'MLE') && (
                                <div className="flex gap-4 text-xs font-medium text-slate-400 bg-black/20 p-2.5 rounded-lg border border-white/5">
                                    <span className="flex items-center gap-1.5"><Clock size={14} /> {sub.executionTime || 0} ms</span>
                                    <span className="flex items-center gap-1.5 border-l border-white/10 pl-4">💾 {sub.memoryUsed || 0} KB</span>
                                    <span className="flex items-center gap-1.5 border-l border-white/10 pl-4 text-amber-400">🏆 {sub.score || 0} pts</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Hiển thị Slider Panel chi tiết bài nộp khi click */}
            <SubmissionDetailPanel
                submissionId={selectedSubmissionId}
                onClose={() => setSelectedSubmissionId(null)}
            />
        </div>
    );
};

export default SubmissionHistory;
