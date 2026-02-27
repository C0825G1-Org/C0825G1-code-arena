import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSocket } from '../../../../shared/hooks/useSocket';
import { CheckCircle, Clock, WarningCircle, XCircle } from '@phosphor-icons/react';

const SubmissionHistory = ({ problemId }) => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Initial load
    useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                const token = localStorage.getItem('token');
                // Assume endpoint /api/v1/submissions/me?problemId=...
                const response = await axios.get(`http://localhost:8080/api/v1/submissions/me?problemId=${problemId}`, {
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
    }, [problemId]);

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

        setSubmissions((prev) => {
            // Check if submission already exists in list (update it)
            const existsIndex = prev.findIndex(s => s.id === data.submissionId || s.submissionId === data.submissionId);
            if (existsIndex >= 0) {
                const newSubmissions = [...prev];
                newSubmissions[existsIndex] = { ...newSubmissions[existsIndex], ...data, id: data.submissionId };
                return newSubmissions;
            }
            // Add new to top
            return [{ ...data, id: data.submissionId, createdAt: new Date().toISOString() }, ...prev];
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
        <div className="flex flex-col h-full bg-slate-900 text-slate-300 p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4 border-b border-slate-700 pb-2">Lịch sử nộp bài</h3>
            {submissions.length === 0 ? (
                <div className="text-center text-slate-500 mt-4">Chưa có bài nộp nào.</div>
            ) : (
                <div className="flex flex-col gap-3">
                    {submissions.map((sub, index) => (
                        <div key={sub.id || index} className="p-3 bg-slate-800 rounded border border-slate-700 hover:border-slate-600 transition-colors">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-medium">{getStatusUI(sub.status)}</span>
                                <span className="text-xs text-slate-500">
                                    {sub.createdAt ? new Date(sub.createdAt).toLocaleTimeString() : 'Vừa xong'}
                                </span>
                            </div>
                            {(sub.status === 'AC' || sub.status === 'WA' || sub.status === 'TLE' || sub.status === 'MLE') && (
                                <div className="flex gap-4 text-xs text-slate-400 bg-slate-900 p-2 rounded">
                                    <span>⏱️ {sub.executionTime || 0} ms</span>
                                    <span>💾 {sub.memoryUsed || 0} MB</span>
                                    <span>🏆 Điểm: {sub.score || 0}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SubmissionHistory;
