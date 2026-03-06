import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ModeratorLayout } from '../../../components/ModeratorLayout';
import {
    ArrowLeft, Trophy, UsersThree, WarningCircle, ListNumbers, Star, Clock,
    Medal, ChartBar, Target, Timer, CheckCircle, XCircle as XCircleIcon, Crown
} from '@phosphor-icons/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import axiosClient from '../../../../../shared/services/axiosClient';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../app/store';
import { AdminLayout } from '../../../../admin/components/AdminLayout';

/* ────── Types ────── */
interface Problem {
    id: number;
    title: string;
    difficulty: string;
    maxScore: number;
    orderIndex?: number;
}

interface ContestDetails {
    id: number;
    title: string;
    status: string;
    participantCount: number;
    startTime: string;
    endTime: string;
    problems: Problem[];
}

interface ProblemDetail {
    problemId: number;
    isAccepted: boolean;
    failedAttempts: number;
    solvedTimeMinutes: number | null;
    score: number | null;
}

interface LeaderboardEntry {
    rank: number;
    userId: number;
    username: string;
    fullName: string;
    totalScore: number;
    totalPenalty: number;
    totalSolved: number;
    problemDetails: ProblemDetail[];
}

/* ────── Helpers ────── */
const formatDate = (s: string) => {
    if (!s) return 'N/A';
    return new Date(s).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
};

const diffMs = (a: string, b: string) => {
    const d = new Date(b).getTime() - new Date(a).getTime();
    if (d <= 0) return '—';
    const h = Math.floor(d / 3600000);
    const m = Math.floor((d % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}p` : `${m} phút`;
};

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'] as const;
const BAND_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981'];

/* ────── Component ────── */
export const ContestResultsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);
    const isAdmin = user?.role?.toUpperCase() === 'ADMIN';
    const backPath = isAdmin ? '/admin/contests' : '/moderator/contests';

    const [contest, setContest] = useState<ContestDetails | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [contestRes, lbRes]: any[] = await Promise.all([
                    axiosClient.get(`/contests/${id}`),
                    axiosClient.get(`/contests/${id}/leaderboard`),
                ]);
                setContest({
                    id: contestRes.id,
                    title: contestRes.title,
                    status: contestRes.status,
                    participantCount: contestRes.participantCount || 0,
                    startTime: contestRes.startTime,
                    endTime: contestRes.endTime,
                    problems: contestRes.problems || [],
                });
                setLeaderboard(Array.isArray(lbRes) ? lbRes : []);
            } catch (e) {
                console.error('Failed to fetch contest results:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [id]);

    /* ─── Computed Stats ─── */
    const stats = useMemo(() => {
        if (!contest || leaderboard.length === 0) return null;

        const totalProblems = contest.problems.length > 0
            ? contest.problems.length
            : (leaderboard.length > 0 && leaderboard[0].problemDetails?.length > 0
                ? leaderboard[0].problemDetails.length
                : Math.max(1, ...leaderboard.map(e => e.totalSolved || 0)));
        let totalSubmissions = 0;
        let totalAC = 0;
        let totalSolveTimeMin = 0;
        let solveTimeCount = 0;
        const scores = leaderboard.map(e => e.totalScore);
        const maxScore = Math.max(...scores);
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

        const problemMap = new Map<number, { accepted: number; total: number; totalTime: number; timeCount: number }>();
        contest.problems.forEach(p => problemMap.set(p.id, { accepted: 0, total: 0, totalTime: 0, timeCount: 0 }));

        leaderboard.forEach(entry => {
            entry.problemDetails?.forEach(pd => {
                const attempts = pd.failedAttempts + (pd.isAccepted ? 1 : 0);
                totalSubmissions += attempts;
                if (pd.isAccepted) {
                    totalAC++;
                    if (pd.solvedTimeMinutes && pd.solvedTimeMinutes > 0) {
                        totalSolveTimeMin += pd.solvedTimeMinutes;
                        solveTimeCount++;
                    }
                }
                const pm = problemMap.get(pd.problemId);
                if (pm) {
                    pm.total++;
                    if (pd.isAccepted) {
                        pm.accepted++;
                        if (pd.solvedTimeMinutes && pd.solvedTimeMinutes > 0) {
                            pm.totalTime += pd.solvedTimeMinutes;
                            pm.timeCount++;
                        }
                    }
                }
            });
        });

        const avgSolveTime = solveTimeCount > 0 ? Math.round(totalSolveTimeMin / solveTimeCount) : 0;
        const overallACRate = leaderboard.length * totalProblems > 0
            ? Math.round((totalAC / (leaderboard.length * totalProblems)) * 100)
            : 0;

        const bands = [
            { label: '0%', min: 0, max: 0, count: 0 },
            { label: '1–25%', min: 0.01, max: 0.25, count: 0 },
            { label: '26–50%', min: 0.26, max: 0.50, count: 0 },
            { label: '51–75%', min: 0.51, max: 0.75, count: 0 },
            { label: '76–100%', min: 0.76, max: 1.0, count: 0 },
        ];
        leaderboard.forEach(e => {
            const pct = e.totalScore / totalProblems;
            if (pct === 0) bands[0].count++;
            else if (pct <= 0.25) bands[1].count++;
            else if (pct <= 0.50) bands[2].count++;
            else if (pct <= 0.75) bands[3].count++;
            else bands[4].count++;
        });

        const difficultyCount: Record<string, number> = {};
        contest.problems.forEach(p => {
            const d = p.difficulty || 'UNKNOWN';
            difficultyCount[d] = (difficultyCount[d] || 0) + 1;
        });
        const difficultyData = Object.entries(difficultyCount).map(([name, value]) => ({ name, value }));

        return {
            totalSubmissions,
            totalAC,
            overallACRate,
            maxScore,
            avgScore: Math.round(avgScore * 10) / 10,
            avgSolveTime,
            problemMap,
            bands,
            difficultyData,
            totalProblems
        };
    }, [contest, leaderboard]);

    /* ─── Loading / Empty ─── */
    const loadingContent = (
        <div className="flex flex-col items-center justify-center p-12 text-slate-400">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium">Đang tải dữ liệu kết quả...</p>
        </div>
    );

    const errorContent = (
        <div className="flex flex-col items-center justify-center p-12 text-slate-400">
            <WarningCircle weight="duotone" className="text-5xl text-red-500 mb-4" />
            <h2 className="text-lg font-bold text-white mb-2">Không tìm thấy cuộc thi</h2>
            <button onClick={() => navigate(backPath)} className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-medium transition-colors">
                Quay lại danh sách
            </button>
        </div>
    );

    if (loading) return isAdmin ? <AdminLayout title="Kết quả" activeTab="contests">{loadingContent}</AdminLayout> : <ModeratorLayout headerTitle="Kết quả">{loadingContent}</ModeratorLayout>;
    if (!contest) return isAdmin ? <AdminLayout title="Lỗi" activeTab="contests">{errorContent}</AdminLayout> : <ModeratorLayout headerTitle="Lỗi">{errorContent}</ModeratorLayout>;

    const DIFF_COLORS: Record<string, string> = {
        EASY: '#10b981',
        MEDIUM: '#f59e0b',
        HARD: '#ef4444',
        UNKNOWN: '#64748b',
    };

    const mainContent = (
        <div className="max-w-6xl mx-auto w-full pb-8 animate-fade-in relative">
            {/* ─── Header ─── */}
            <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(backPath)}
                        className="p-2 bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-700/50"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 tracking-tight flex items-center gap-2">
                            <Trophy weight="fill" className="text-purple-500" />
                            Thống Kê Kết Quả Cuộc Thi
                        </h1>
                        <p className="text-slate-400 mt-1 text-base">
                            {contest.title}
                            <span className="text-sm font-mono text-slate-500 ml-2">#{contest.id}</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-400">
                    <div className="flex items-center gap-1.5"><Clock weight="duotone" className="text-emerald-400" /> {formatDate(contest.startTime)}</div>
                    <span className="text-slate-600">→</span>
                    <div className="flex items-center gap-1.5"><Clock weight="duotone" className="text-red-400" /> {formatDate(contest.endTime)}</div>
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-700/50 text-slate-300 border border-slate-600/50">
                        ⏱ {diffMs(contest.startTime, contest.endTime)}
                    </span>
                </div>
            </div>

            {/* ─── Key Metrics ─── */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                {[
                    { label: 'Thí sinh', value: contest.participantCount, icon: UsersThree, color: 'blue' },
                    { label: 'Tổng lượt nộp', value: stats?.totalSubmissions ?? 0, icon: ChartBar, color: 'indigo' },
                    { label: 'Tỉ lệ AC', value: `${stats?.overallACRate ?? 0}%`, icon: Target, color: 'emerald' },
                    { label: 'Điểm cao nhất', value: stats?.maxScore ?? 0, icon: Crown, color: 'yellow' },
                    { label: 'Điểm trung bình', value: stats?.avgScore ?? 0, icon: Star, color: 'purple' },
                    { label: 'TB thời gian giải', value: stats?.avgSolveTime ? `${stats.avgSolveTime}p` : '—', icon: Timer, color: 'rose' },
                ].map((m, i) => (
                    <div key={i} className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-xl p-4 hover:border-slate-600/80 transition-colors group">
                        <div className="flex items-center gap-2 mb-1.5">
                            <div className="p-2 rounded-lg bg-slate-800 group-hover:bg-slate-700">
                                <m.icon weight="duotone" size={20} className="text-blue-400" />
                            </div>
                            <span className="text-xs text-slate-400 font-medium">{m.label}</span>
                        </div>
                        <p className="text-xl font-bold text-white">{m.value}</p>
                    </div>
                ))}
            </div>

            {/* ─── Top 3 Podium ─── */}
            {leaderboard.length >= 1 && (
                <div className="mb-6">
                    <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                        <Medal weight="fill" className="text-yellow-400" /> Top Thí Sinh Xuất Sắc
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {leaderboard.slice(0, 3).map((entry, i) => (
                            <div key={entry.userId || i}
                                className={`relative overflow-hidden bg-slate-900/60 backdrop-blur-md border rounded-xl p-5 transition-all hover:scale-[1.02] ${i === 0 ? 'border-yellow-500/40 shadow-[0_0_30px_rgba(234,179,8,0.1)]'
                                    : i === 1 ? 'border-slate-400/30' : 'border-amber-700/30'
                                    }`}>
                                {/* Glow */}
                                <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20"
                                    style={{ background: MEDAL_COLORS[i] }} />

                                <div className="relative z-10 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black"
                                        style={{ background: `${MEDAL_COLORS[i]}20`, color: MEDAL_COLORS[i] }}>
                                        #{i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-white text-lg truncate">{entry.fullName || entry.username}</p>
                                        <p className="text-sm text-slate-400 font-mono truncate">@{entry.username}</p>
                                    </div>
                                </div>
                                <div className="relative z-10 mt-4 flex items-center justify-between text-sm">
                                    <div>
                                        <span className="text-slate-400">Số bài AC: </span>
                                        <span className="text-white font-bold text-lg">{entry.totalSolved}</span>
                                        <span className="text-slate-500">/{stats?.totalProblems}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-400">
                                        <span className="flex items-center gap-1"><CheckCircle weight="fill" className="text-emerald-400" /> {entry.totalSolved}</span>
                                        <span>⏱ {entry.totalPenalty}p</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── Charts Row ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-6">
                {/* Score Distribution */}
                <div className="lg:col-span-3 bg-slate-900/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-5">
                        <ChartBar weight="duotone" className="text-blue-400" /> Phân Bố Điểm Số
                    </h3>
                    {stats && stats.bands.some(b => b.count > 0) ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={stats.bands} barSize={40}>
                                <XAxis dataKey="label" tick={{ fill: '#e2e8f0', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#e2e8f0', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }}
                                    itemStyle={{ color: '#ffffff' }}
                                    formatter={(v: number) => [`${v} thí sinh`, 'Số lượng']}
                                />
                                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                                    {stats.bands.map((_entry, i) => (
                                        <Cell key={i} fill={BAND_COLORS[i]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[200px] flex items-center justify-center text-slate-500">Chưa có dữ liệu</div>
                    )}
                </div>

                {/* Difficulty Pie */}
                <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-5">
                        <ListNumbers weight="duotone" className="text-purple-400" /> Phân Bố Độ Khó
                    </h3>
                    {stats && stats.difficultyData.length > 0 ? (
                        <div className="flex flex-col items-center">
                            <ResponsiveContainer width="100%" height={180}>
                                <PieChart>
                                    <Pie
                                        data={stats.difficultyData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {stats.difficultyData.map((entry, i) => (
                                            <Cell key={i} fill={DIFF_COLORS[entry.name] || '#64748b'} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }}
                                        itemStyle={{ color: '#ffffff' }}
                                        formatter={(v: number) => [`${v} bài`, 'Số lượng']}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex gap-4 mt-2">
                                {stats.difficultyData.map(d => (
                                    <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-300">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: DIFF_COLORS[d.name] || '#64748b' }} />
                                        {d.name} ({d.value})
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-[180px] flex items-center justify-center text-slate-500">Không có dữ liệu</div>
                    )}
                </div>
            </div>

            {/* ─── Per-Problem Stats ─── */}
            <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden mb-6">
                <div className="p-4 border-b border-slate-700/50 bg-slate-800/30">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Target weight="duotone" className="text-emerald-400" /> Thống Kê Từng Bài Tập
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-slate-400 border-b border-slate-700/50">
                                <th className="px-5 py-3 font-medium">#</th>
                                <th className="px-5 py-3 font-medium">Tên bài</th>
                                <th className="px-5 py-3 font-medium">Độ khó</th>
                                <th className="px-5 py-3 font-medium text-center">Điểm tối đa</th>
                                <th className="px-5 py-3 font-medium text-center">AC / Tổng</th>
                                <th className="px-5 py-3 font-medium text-center">Tỉ lệ AC</th>
                                <th className="px-5 py-3 font-medium text-center">TB thời gian</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contest.problems.map((prob, idx) => {
                                const pm = stats?.problemMap.get(prob.id);
                                const acRate = pm && pm.total > 0 ? Math.round((pm.accepted / pm.total) * 100) : 0;
                                const avgTime = pm && pm.timeCount > 0 ? Math.round(pm.totalTime / pm.timeCount) : null;
                                return (
                                    <tr key={prob.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                        <td className="px-5 py-3.5 font-mono text-slate-500">{idx + 1}</td>
                                        <td className="px-5 py-3.5 font-semibold text-white">{prob.title}</td>
                                        <td className="px-5 py-3.5">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${prob.difficulty === 'EASY' ? 'bg-emerald-500/15 text-emerald-400' :
                                                prob.difficulty === 'MEDIUM' ? 'bg-yellow-500/15 text-yellow-400' :
                                                    'bg-red-500/15 text-red-400'
                                                }`}>
                                                {prob.difficulty}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-center text-yellow-400 font-bold">{prob.maxScore}</td>
                                        <td className="px-5 py-3.5 text-center">
                                            <span className="text-emerald-400 font-bold">{pm?.accepted ?? 0}</span>
                                            <span className="text-slate-500">/{pm?.total ?? 0}</span>
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${acRate}%` }} />
                                                </div>
                                                <span className="text-slate-300 font-medium">{acRate}%</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-center text-slate-300 font-mono">{avgTime ? `${avgTime}p` : '—'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ─── Full Leaderboard ─── */}
            <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-700/50 bg-slate-800/30 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <ListNumbers weight="duotone" className="text-purple-400" /> Bảng Xếp Hạng Đầy Đủ
                    </h3>
                    <span className="text-sm text-slate-400">{leaderboard.length} thí sinh</span>
                </div>
                <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-slate-900 z-10">
                            <tr className="text-left text-slate-400 border-b border-slate-700/50">
                                <th className="px-5 py-3 font-medium w-16">Hạng</th>
                                <th className="px-5 py-3 font-medium">Thí sinh</th>
                                <th className="px-5 py-3 font-medium text-center">Số bài AC</th>
                                <th className="px-5 py-3 font-medium text-center">Tổng điểm</th>
                                <th className="px-5 py-3 font-medium text-center">Penalty</th>
                                {contest.problems.map((p, i) => (
                                    <th key={p.id} className="px-3 py-3 font-medium text-center text-slate-500 text-xs">
                                        Bài {i + 1}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboard.map((entry) => (
                                <tr key={entry.userId} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                    <td className="px-5 py-3">
                                        {entry.rank <= 3 ? (
                                            <span className="flex items-center justify-center w-8 h-8 rounded-full text-xs font-black"
                                                style={{ background: `${MEDAL_COLORS[entry.rank - 1]}20`, color: MEDAL_COLORS[entry.rank - 1] }}>
                                                {entry.rank}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 font-mono pl-2">{entry.rank}</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3">
                                        <p className="font-semibold text-white truncate max-w-[200px]">{entry.fullName || entry.username}</p>
                                        <p className="text-xs text-slate-500 font-mono">@{entry.username}</p>
                                    </td>
                                    <td className="px-5 py-3 text-center font-bold text-emerald-400">{entry.totalSolved}</td>
                                    <td className="px-5 py-3 text-center font-bold text-white">{entry.totalScore}</td>
                                    <td className="px-5 py-3 text-center text-slate-400 font-mono">{entry.totalPenalty}</td>
                                    {contest.problems.map(p => {
                                        const pd = entry.problemDetails?.find(d => d.problemId === p.id);
                                        if (!pd) return <td key={p.id} className="px-3 py-3 text-center text-slate-600">—</td>;
                                        return (
                                            <td key={p.id} className="px-3 py-3 text-center">
                                                {pd.isAccepted ? (
                                                    <div className="flex flex-col items-center">
                                                        <CheckCircle weight="fill" className="text-emerald-400 text-base" />
                                                        <span className="text-[10px] text-slate-400 mt-0.5">
                                                            {pd.solvedTimeMinutes ? `${pd.solvedTimeMinutes}p` : ''}
                                                            {pd.failedAttempts > 0 ? ` (-${pd.failedAttempts})` : ''}
                                                        </span>
                                                    </div>
                                                ) : pd.failedAttempts > 0 ? (
                                                    <div className="flex flex-col items-center">
                                                        <XCircleIcon weight="fill" className="text-red-400/60 text-base" />
                                                        <span className="text-[10px] text-red-400/50 mt-0.5">-{pd.failedAttempts}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-600">—</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    if (isAdmin) {
        return (
            <AdminLayout title={`Kết quả: ${contest.title}`} activeTab="contests">
                {mainContent}
            </AdminLayout>
        );
    }

    return (
        <ModeratorLayout headerTitle={`Kết quả: ${contest.title}`}>
            {mainContent}
        </ModeratorLayout>
    );
};
