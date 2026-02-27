import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ModeratorLayout } from '../../../layouts/ModeratorLayout';
import {
    ArrowLeft,
    Trophy,
    UsersThree,
    WarningCircle,
    ListNumbers,
    Star,
    Clock
} from '@phosphor-icons/react';
import axiosClient from '../../../../../shared/services/axiosClient';

interface Problem {
    id: number;
    title: string;
    difficulty: string;
    maxScore: number;
}

interface ContestDetails {
    id: number;
    title: string;
    participantCount: number;
    startTime: string;
    endTime: string;
    problems: Problem[];
}

export const ContestResultsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [contest, setContest] = useState<ContestDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res: any = await axiosClient.get(`/contests/${id}`);
                setContest({
                    id: res.id,
                    title: res.title,
                    participantCount: res.participantCount || 0,
                    startTime: res.startTime,
                    endTime: res.endTime,
                    problems: res.problems || []
                });
            } catch (error) {
                console.error("Failed to fetch contest:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            hour: '2-digit', minute: '2-digit',
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    if (loading) {
        return (
            <ModeratorLayout>
                <div className="flex h-full items-center justify-center text-slate-400">
                    <div className="animate-pulse flex flex-col items-center">
                        <Trophy className="text-4xl mb-4 text-purple-500/50" />
                        <p>Đang tải dữ liệu cuộc thi...</p>
                    </div>
                </div>
            </ModeratorLayout>
        );
    }

    if (!contest) {
        return (
            <ModeratorLayout>
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <WarningCircle weight="duotone" className="text-6xl text-red-500 mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Không tìm thấy cuộc thi</h2>
                    <button
                        onClick={() => navigate('/moderator/contests')}
                        className="mt-6 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-medium transition-colors"
                    >
                        Quay lại danh sách
                    </button>
                </div>
            </ModeratorLayout>
        );
    }

    const totalScore = contest.problems.reduce((sum, p) => sum + (p.maxScore || 0), 0);

    return (
        <ModeratorLayout>
            <div className="max-w-7xl mx-auto w-full pb-12 animate-fade-in relative">

                {/* Header Section */}
                <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <button
                            onClick={() => navigate('/moderator/contests')}
                            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-4 transition-colors group"
                        >
                            <ArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                            Quay lại danh sách
                        </button>
                        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 tracking-tight flex items-center gap-3">
                            <Trophy weight="fill" className="text-purple-500" />
                            Tổng Quan Cuộc Thi (Đã Khép Lại)
                        </h1>
                        <p className="text-slate-400 mt-2 text-lg">
                            {contest.title} <span className="text-sm font-mono text-slate-500 ml-2">#{contest.id}</span>
                        </p>
                    </div>
                </div>

                {/* Coming Soon Notice */}
                <div className="mb-8 bg-blue-500/10 border border-blue-500/20 rounded-xl p-5 flex items-start gap-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full translate-x-10 -translate-y-10"></div>
                    <WarningCircle weight="fill" className="text-blue-400 text-2xl shrink-0 relative z-10" />
                    <div className="relative z-10 text-blue-100/80 leading-relaxed">
                        <strong className="text-blue-300 font-semibold block mb-1">Tính năng Thống Kê Nâng Cao đang được phát triển</strong>
                        Dữ liệu thật về các lượt nộp bài (Submissions), tỷ lệ Accepted, Bảng xếp hạng Top Coder và Điểm số chi tiết sẽ được tích hợp sau khi hệ thống Backend Judge hoàn thiện. Dưới đây là các thông tin khả dụng hiện tại.
                    </div>
                </div>

                {/* Key Metrics Grid (Authentic Data) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Metric 1 */}
                    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600 transition-colors group">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-slate-400 text-sm font-medium">Số lượng thí sinh</p>
                                <h3 className="text-3xl font-bold text-white mt-1">
                                    {contest.participantCount}
                                </h3>
                            </div>
                            <div className="p-3 bg-blue-500/10 rounded-xl">
                                <UsersThree weight="duotone" className="text-blue-400 text-2xl" />
                            </div>
                        </div>
                    </div>

                    {/* Metric 2 */}
                    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600 transition-colors group">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-slate-400 text-sm font-medium">Số lượng bài tập</p>
                                <h3 className="text-3xl font-bold text-white mt-1 text-purple-400">
                                    {contest.problems.length}
                                </h3>
                            </div>
                            <div className="p-3 bg-purple-500/10 rounded-xl">
                                <ListNumbers weight="duotone" className="text-purple-400 text-2xl" />
                            </div>
                        </div>
                    </div>

                    {/* Metric 3 */}
                    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600 transition-colors group">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-slate-400 text-sm font-medium">Tổng quỹ điểm</p>
                                <h3 className="text-3xl font-bold text-white mt-1 text-yellow-400">
                                    {totalScore}
                                </h3>
                            </div>
                            <div className="p-3 bg-yellow-500/10 rounded-xl">
                                <Star weight="duotone" className="text-yellow-400 text-2xl" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional Info Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Event Timeline */}
                    <div className="lg:col-span-1 bg-slate-900/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                            <Clock weight="duotone" className="text-emerald-400" />
                            Khung Thời Gian
                        </h3>
                        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
                            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                <div className="flex items-center justify-center w-4 h-4 rounded-full border-4 border-slate-900 bg-emerald-500 text-emerald-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2"></div>
                                <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] ml-4 md:ml-0 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                                    <h4 className="font-semibold text-slate-200">Bắt đầu</h4>
                                    <span className="text-sm font-mono text-emerald-400">{formatDate(contest.startTime)}</span>
                                </div>
                            </div>
                            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                <div className="flex items-center justify-center w-4 h-4 rounded-full border-4 border-slate-900 bg-red-500 text-red-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2"></div>
                                <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] ml-4 md:ml-0 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                                    <h4 className="font-semibold text-slate-200">Kết thúc</h4>
                                    <span className="text-sm font-mono text-red-400">{formatDate(contest.endTime)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Problems List */}
                    <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl flex flex-col overflow-hidden">
                        <div className="p-5 border-b border-slate-700/50 bg-slate-800/30">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <ListNumbers weight="duotone" className="text-purple-400" />
                                Bộ Đề Bài
                            </h3>
                        </div>
                        <div className="p-4 flex-1">
                            {contest.problems.length > 0 ? (
                                <div className="space-y-3">
                                    {contest.problems.map((prob) => (
                                        <div key={prob.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 transition-colors">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-white">{prob.title}</span>
                                                <span className="text-sm text-slate-500 font-mono">ID: #{prob.id}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${prob.difficulty === 'EASY' ? 'bg-emerald-500/10 text-emerald-400' :
                                                        prob.difficulty === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-400' :
                                                            'bg-red-500/10 text-red-400'
                                                    }`}>
                                                    {prob.difficulty}
                                                </span>
                                                <span className="font-bold text-purple-400 flex items-center gap-1">
                                                    {prob.maxScore} <Star weight="fill" className="text-yellow-500 text-sm" />
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12">
                                    <WarningCircle className="text-4xl mb-2 opacity-50" />
                                    <p>Cuộc thi này không có bài tập nào.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </ModeratorLayout>
    );
};
