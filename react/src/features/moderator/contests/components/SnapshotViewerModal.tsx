import React, { useEffect, useState } from 'react';
import axiosClient from '../../../../shared/services/axiosClient';

interface Snapshot {
    id: number;
    fileName: string;
    imageUrl: string;
    capturedAt: string;
}

interface SnapshotViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    contestId: number;
    user: {
        userId: number;
        fullname: string;
        username: string;
    } | null;
}

export const SnapshotViewerModal: React.FC<SnapshotViewerModalProps> = ({ isOpen, onClose, contestId, user }) => {
    const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && user) {
            fetchSnapshots();
        } else {
            setSnapshots([]);
            setError(null);
        }
    }, [isOpen, user]);

    const fetchSnapshots = async () => {
        try {
            setLoading(true);
            setError(null);
            const res: any = await axiosClient.get(`/snapshots/contest/${contestId}/user/${user?.userId}`);

            // Note: Adjust the response mapping if the backend returns a different format
            // Assumes res is the array directly, based on the Spring Boot Controller
            const data: Snapshot[] = Array.isArray(res) ? res : (res.data || []);

            // Sort by latest first
            const sortedData = [...data].sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime());

            setSnapshots(sortedData);
        } catch (err: any) {
            console.error("Lỗi khi tải ảnh snapshot:", err);
            setError("Không thể tải hình ảnh giám sát. Vui lòng thử lại sau.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-md transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-slate-900 border border-slate-700 w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-slide-up">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                            <i className="ph-duotone ph-images text-xl"></i>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white leading-tight">
                                Ảnh giám sát: <span className="text-blue-400">{user.fullname}</span>
                            </h2>
                            <p className="text-xs text-slate-400">@{user.username}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                        <i className="ph-bold ph-x"></i>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 bg-[#0B1120] custom-scrollbar min-h-[400px]">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                            <i className="ph-duotone ph-spinner-gap text-4xl text-blue-500 animate-spin"></i>
                            <p>Đang tải ảnh giám sát...</p>
                        </div>
                    ) : error ? (
                        <div className="h-full flex flex-col items-center justify-center text-rose-400 gap-3 bg-rose-500/5 rounded-xl border border-rose-500/10 p-8">
                            <i className="ph-duotone ph-warning-circle text-4xl"></i>
                            <p className="text-center">{error}</p>
                            <button
                                onClick={fetchSnapshots}
                                className="mt-2 px-4 py-2 bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg transition-colors text-sm font-medium"
                            >
                                Thử lại
                            </button>
                        </div>
                    ) : snapshots.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                            <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center">
                                <i className="ph-duotone ph-camera-slash text-3xl"></i>
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-medium text-slate-300">Chưa có ảnh chụp nào</p>
                                <p className="text-sm mt-1">Hệ thống chưa ghi nhận được hình ảnh giám sát của thí sinh này.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {snapshots.map((snapshot) => {
                                const dateObj = new Date(snapshot.capturedAt);
                                return (
                                    <div key={snapshot.id} className="group bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex flex-col shadow-lg hover:border-blue-500/50 transition-colors">
                                        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                                            {/* We use API baseURL logic here to get the full image URL. 
                                                If API is http://localhost:8080/api/snapshots...
                                                The imageUrl from backend is likely /uploads/snapshots/xxx.jpg
                                            */}
                                            <img
                                                src={snapshot.imageUrl.startsWith('http') ? snapshot.imageUrl : `http://localhost:8080${snapshot.imageUrl}`}
                                                alt={`Snapshot ${snapshot.id}`}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                loading="lazy"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = 'https://placehold.co/600x400/1e293b/475569?text=Image+Not+Found';
                                                }}
                                            />
                                            <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded text-xs font-mono text-white/90 border border-white/10 shadow-sm">
                                                {dateObj.toLocaleTimeString('vi-VN', { hour12: false })}
                                            </div>
                                        </div>
                                        <div className="p-3 bg-slate-900 border-t border-slate-800 flex justify-between items-center text-xs">
                                            <div className="text-slate-400 truncate pr-2 flex items-center gap-1.5">
                                                <i className="ph-fill ph-image text-slate-500"></i>
                                                <span className="truncate" title={snapshot.fileName}>{snapshot.fileName}</span>
                                            </div>
                                            <div className="text-slate-500 whitespace-nowrap">
                                                {dateObj.toLocaleDateString('vi-VN')}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
