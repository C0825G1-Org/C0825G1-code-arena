import { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../app/store';
import { ModeratorLayout } from '../../components/ModeratorLayout';
import {
    Users,
    CalendarStar,
    WarningCircle,
    TrendUp,
    CircleNotch,
    Trophy,
    ChartLine,
    ChartDonut
} from '@phosphor-icons/react';
import {
    ResponsiveContainer,
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    PieChart, Pie, Cell,
} from 'recharts';
import {
    moderatorDashboardService,
    ModeratorDashboardStats,
    HourlySubmissionDTO
} from '../services/moderatorDashboardService';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export const ModDashboardPage = () => {
    const user = useSelector((state: RootState) => state.auth.user);
    const [stats, setStats] = useState<ModeratorDashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    const isFirstTrendRender = useRef(true);
    const [submissionTrend, setSubmissionTrend] = useState<HourlySubmissionDTO[]>([]);
    const [trendRange, setTrendRange] = useState<string>('24h');
    const [trendLoading, setTrendLoading] = useState(false);

    const today = new Date().toISOString().split('T')[0];
    const [dateFrom, setDateFrom] = useState<string>(() => {
        const d = new Date(); d.setDate(d.getDate() - 7);
        return d.toISOString().split('T')[0];
    });
    const [dateTo, setDateTo] = useState<string>(today);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await moderatorDashboardService.getDashboardStats();
                setStats(data);
                setSubmissionTrend(data.submissionTrend ?? []);
            } catch (error) {
                console.error('Lỗi khi tải dữ liệu thống kê:', error);
                toast.error('Không thể tải dữ liệu thống kê. Vui lòng thử lại sau.');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    useEffect(() => {
        if (isFirstTrendRender.current) { isFirstTrendRender.current = false; return; }
        if (trendRange === 'custom') return;
        setTrendLoading(true);
        moderatorDashboardService.getTrend(trendRange)
            .then(data => setSubmissionTrend(data))
            .catch(console.error)
            .finally(() => setTrendLoading(false));
    }, [trendRange]);

    const applyDateRange = () => {
        if (!dateFrom || !dateTo || dateFrom > dateTo) return;
        setTrendRange('custom');
        setTrendLoading(true);
        moderatorDashboardService.getTrendByRange(dateFrom, dateTo)
            .then(data => setSubmissionTrend(data))
            .catch(console.error)
            .finally(() => setTrendLoading(false));
    };

    const REFRESH_INTERVAL = 15;
    const [refreshCountdown, setRefreshCountdown] = useState(REFRESH_INTERVAL);

    useEffect(() => {
        if (trendRange === 'custom') return;

        const fetchTrend = () => {
            if (document.hidden) return;
            moderatorDashboardService.getTrend(trendRange)
                .then(data => setSubmissionTrend(data))
                .catch(console.error);
        };

        let count = REFRESH_INTERVAL;
        const ticker = setInterval(() => {
            if (document.hidden) { count = REFRESH_INTERVAL; setRefreshCountdown(REFRESH_INTERVAL); return; }
            count -= 1;
            setRefreshCountdown(count);
            if (count <= 0) {
                count = REFRESH_INTERVAL;
                setRefreshCountdown(REFRESH_INTERVAL);
                fetchTrend();
            }
        }, 1000);

        return () => clearInterval(ticker);
    }, [trendRange]);

    return (
        <ModeratorLayout>
            <div className="flex-1 overflow-y-auto p-8 bg-[#0f172a] space-y-8 animate-fade-in-up">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Thống kê tổng quan</h1>
                    <p className="text-slate-400">
                        Chào mừng {user?.fullName || user?.username} trở lại CodeMod. Dưới đây là hiệu suất quản lý cuộc thi của bạn.
                    </p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <CircleNotch weight="bold" className="text-4xl text-purple-500 animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Main Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Total Participants */}
                            <div className="bg-slate-800/40 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 hover:border-purple-500/30 transition-colors relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Users weight="duotone" className="text-6xl text-purple-400" />
                                </div>
                                <h3 className="text-slate-400 font-medium mb-1 flex items-center gap-2">
                                    <Users weight="bold" className="text-purple-400" /> Tổng Số Thí Sinh
                                </h3>
                                <div className="text-4xl font-bold text-white mb-2">{stats?.totalParticipants || 0}</div>
                                <div className="text-xs text-slate-500">Người tham gia các cuộc thi của bạn</div>
                            </div>

                            {/* Total Contests */}
                            <div className="bg-slate-800/40 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 hover:border-blue-500/30 transition-colors relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <CalendarStar weight="duotone" className="text-6xl text-blue-400" />
                                </div>
                                <h3 className="text-slate-400 font-medium mb-1 flex items-center gap-2">
                                    <CalendarStar weight="bold" className="text-blue-400" /> Cuộc Thi Đã Tạo
                                </h3>
                                <div className="text-4xl font-bold text-white mb-2">{stats?.totalContests || 0}</div>
                                <div className="text-xs text-slate-500">Bao gồm cả đang diễn ra và kết thúc</div>
                            </div>

                            {/* Submissions (24h) */}
                            <div className="bg-slate-800/40 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 hover:border-emerald-500/30 transition-colors relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <TrendUp weight="duotone" className="text-6xl text-emerald-400" />
                                </div>
                                <h3 className="text-slate-400 font-medium mb-1 flex items-center gap-2">
                                    <TrendUp weight="bold" className="text-emerald-400" /> Lượt Nộp Trong 24h
                                </h3>
                                <div className="text-4xl font-bold text-white mb-2">{stats?.submissionsLast24h || 0}</div>
                                <div className="text-xs text-emerald-500/80 font-medium">Hoạt động trong ngày</div>
                            </div>

                            {/* Pending Problems */}
                            <div className="bg-slate-800/40 backdrop-blur-md p-6 rounded-2xl border border-orange-500/30 hover:border-orange-500/50 transition-colors relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <WarningCircle weight="duotone" className="text-6xl text-orange-400" />
                                </div>
                                <h3 className="text-orange-400/80 font-medium mb-1 flex items-center gap-2">
                                    <WarningCircle weight="bold" className="text-orange-400" /> Cần Thêm Testcase
                                </h3>
                                <div className="text-4xl font-bold text-orange-400 mb-2">{stats?.pendingProblems || 0}</div>
                                <div className="text-xs text-orange-500/70">Bài tập đang thiếu bộ test</div>
                            </div>
                        </div>

                        {/* Charts Area */}
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                            {/* Submission Trend - Line/Area chart (2/3 width) */}
                            <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 xl:col-span-2">
                                <div className="flex items-center gap-2 mb-5 flex-wrap">
                                    <ChartLine weight="duotone" className="text-2xl text-blue-400 shrink-0" />
                                    <h3 className="text-base font-bold text-white">
                                        Lượt nộp bài –&nbsp;
                                        <span className="text-blue-400">
                                            {trendRange === '7d' ? '7 ngày' : trendRange === 'custom' ? 'Tùy chọn' : 'Hôm nay'}
                                        </span>
                                    </h3>
                                    {trendLoading && (
                                        <span className="text-xs font-normal text-slate-500 font-mono animate-pulse">loading...</span>
                                    )}
                                    {!trendLoading && trendRange !== 'custom' && (
                                        <span className="text-xs text-slate-500 font-mono ml-2" title="Auto-refresh">
                                            ↻ {refreshCountdown}s
                                        </span>
                                    )}
                                    <div className="ml-auto flex gap-1 bg-slate-900 rounded-lg p-1">
                                        {(['24h', '7d'] as const).map(r => (
                                            <button
                                                key={r}
                                                onClick={() => setTrendRange(r)}
                                                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${trendRange === r
                                                        ? 'bg-blue-500 text-white shadow'
                                                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                                                    }`}
                                            >
                                                {r === '7d' ? '7 ngày' : 'Hôm nay'}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => setTrendRange('custom')}
                                            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${trendRange === 'custom'
                                                    ? 'bg-purple-500 text-white shadow'
                                                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                                                }`}
                                        >
                                            Tùy chọn
                                        </button>
                                    </div>
                                </div>

                                {trendRange === 'custom' && (
                                    <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-slate-900/60 rounded-xl border border-slate-700">
                                        <span className="text-xs text-slate-400 font-medium shrink-0">Từ ngày</span>
                                        <input
                                            type="date" value={dateFrom} max={dateTo}
                                            onChange={e => setDateFrom(e.target.value)}
                                            className="bg-slate-800 border border-slate-600 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 transition"
                                        />
                                        <span className="text-xs text-slate-400 font-medium shrink-0">đến ngày</span>
                                        <input
                                            type="date" value={dateTo} min={dateFrom} max={today}
                                            onChange={e => setDateTo(e.target.value)}
                                            className="bg-slate-800 border border-slate-600 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 transition"
                                        />
                                        <button
                                            onClick={applyDateRange}
                                            disabled={!dateFrom || !dateTo || dateFrom > dateTo}
                                            className="ml-auto px-4 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition"
                                        >
                                            Xem
                                        </button>
                                    </div>
                                )}
                                <ResponsiveContainer width="100%" height={220}>
                                    <AreaChart data={submissionTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="modSubmGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                        <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <RechartsTooltip
                                            contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                                            labelStyle={{ color: '#94a3b8' }}
                                            itemStyle={{ color: '#60a5fa' }}
                                            formatter={(v: number) => [`${v} bài`, 'Submissions']}
                                        />
                                        <Area
                                            type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2.5}
                                            fill="url(#modSubmGrad)" dot={false} activeDot={{ r: 5, fill: '#3b82f6', strokeWidth: 0 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Verdict Pie (1/3 width) */}
                            <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 flex flex-col">
                                <h3 className="text-base font-bold text-white flex items-center gap-2 mb-5">
                                    <ChartDonut weight="duotone" className="text-2xl text-emerald-400" />
                                    Tỉ lệ kết quả bài nộp
                                </h3>
                                <div className="flex-1 flex flex-col items-center">
                                    {!stats?.verdictStats || stats.verdictStats.length === 0 ? (
                                        <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">Chưa có dữ liệu bài nộp</div>
                                    ) : (
                                        <>
                                            <ResponsiveContainer width="100%" height={180}>
                                                <PieChart>
                                                    <Pie
                                                        data={stats.verdictStats}
                                                        cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={3}
                                                        dataKey="value" strokeWidth={0} isAnimationActive={false}
                                                    >
                                                        {stats.verdictStats.map((entry, i) => (
                                                            <Cell key={i} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <RechartsTooltip
                                                        contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                                                        itemStyle={{ color: '#f8fafc' }}
                                                        formatter={(v: number, name: string) => [`${v} bài`, name]}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div className="mt-2 w-full space-y-1.5">
                                                {stats.verdictStats.map((d) => (
                                                    <div key={d.name} className="flex items-center justify-between text-xs">
                                                        <span className="flex items-center gap-1.5">
                                                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                                                            <span className="text-slate-400">{d.name}</span>
                                                        </span>
                                                        <span className="font-mono text-white font-semibold">{d.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Active Contests List */}
                        <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 flex-1">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Trophy weight="bold" className="text-purple-400" /> Cuộc Thi Đang Diễn Ra
                            </h2>

                            {(!stats?.activeContests || stats.activeContests.length === 0) ? (
                                <div className="flex flex-col items-center justify-center h-48 text-slate-500 border-2 border-dashed border-slate-700/50 rounded-xl">
                                    <p>Không có cuộc thi nào đang diễn ra ở thời điểm hiện tại.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-700 text-slate-400 text-sm uppercase tracking-wider">
                                                <th className="pb-3 font-semibold pl-2">Tên Cuộc Thi</th>
                                                <th className="pb-3 font-semibold">Bắt Đầu</th>
                                                <th className="pb-3 font-semibold">Kết Thúc</th>
                                                <th className="pb-3 font-semibold text-center">Thí Sinh</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.activeContests.map((contest) => (
                                                <tr key={contest.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors group">
                                                    <td className="py-4 pl-2">
                                                        <div className="font-semibold text-white group-hover:text-purple-400 transition-colors">{contest.title}</div>
                                                        <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                                                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                                            Đang diễn ra
                                                        </div>
                                                    </td>
                                                    <td className="py-4 text-slate-300">
                                                        {format(new Date(contest.startTime), 'HH:mm - dd/MM/yyyy')}
                                                    </td>
                                                    <td className="py-4 text-slate-300">
                                                        {format(new Date(contest.endTime), 'HH:mm - dd/MM/yyyy')}
                                                    </td>
                                                    <td className="py-4 text-center">
                                                        <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-sm font-medium border border-slate-700">
                                                            <Users weight="fill" className="text-slate-400" />
                                                            {contest.participantCount}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </ModeratorLayout>
    );
};
