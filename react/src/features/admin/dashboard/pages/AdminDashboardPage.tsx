import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../../app/store';
import { logout } from '../../../auth/store/authSlice';
import {
    HardDrives, SquaresFour, Users, Cpu, Tag,
    SignOut, FileText, ClockCountdown, Desktop, ChartLine, ChartDonut,
    Trophy, Warning,
} from '@phosphor-icons/react';
import { Avatar } from '../../../../shared/components/Avatar';
import {
    ResponsiveContainer,
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    PieChart, Pie, Cell,
} from 'recharts';
import { adminDashboardApi, type HourlySubmissionDTO, type VerdictStatsDTO, type ActiveContestDTO } from '../services/adminDashboardApi';

// ─── Types ───────────────────────────────────────────────────────────────────

type LogLevel = 'INFO' | 'WARN' | 'ERR!';
interface LogEntry {
    id: number;
    time: string;
    level: LogLevel;
    message: string;
    pulse?: boolean;
}



// ─── Bottom section mock data ───────────────────────────────────────────────

type ContestStatus = 'running' | 'starting_soon';
interface ActiveContest {
    id: number;
    name: string;
    status: ContestStatus;
    startTime: string;
    endTime: string;
    participants: number;
    problems: number;
}

const ACTIVE_CONTESTS: ActiveContest[] = [
    { id: 1, name: 'Weekly Contest #42', status: 'running', startTime: '08:00', endTime: '10:00', participants: 128, problems: 4 },
    { id: 2, name: 'C0825G1 Midterm Exam', status: 'running', startTime: '08:30', endTime: '11:30', participants: 64, problems: 6 },
    { id: 3, name: 'Spring Boot Challenge', status: 'starting_soon', startTime: '09:30', endTime: '11:00', participants: 32, problems: 3 },
    { id: 4, name: 'Algorithm Warmup #7', status: 'starting_soon', startTime: '10:00', endTime: '11:30', participants: 56, problems: 5 },
];

type ErrLevel = 'CRITICAL' | 'ERROR' | 'WARN';
interface ErrorLog {
    id: number;
    time: string;
    level: ErrLevel;
    source: string;
    message: string;
}

const ERROR_LOGS: ErrorLog[] = [
    { id: 1, time: '08:12:05', level: 'CRITICAL', source: 'JudgeWorker', message: "Container 'jv-run-304' OOMKilled. Auto-restarted." },
    { id: 2, time: '08:15:33', level: 'ERROR', source: 'Redis', message: 'Connection timeout after 30s. Retry 1/3.' },
    { id: 3, time: '08:22:10', level: 'WARN', source: 'API Gateway', message: 'Rate limit reached for IP 103.72.x.x (200 req/min).' },
    { id: 4, time: '08:31:47', level: 'ERROR', source: 'Submission SVC', message: 'Failed to persist result for submission #15489.' },
    { id: 5, time: '08:40:02', level: 'WARN', source: 'CPU Monitor', message: 'Node 2 CPU > 85% for 3 consecutive minutes.' },
];

const ERR_LEVEL_STYLE: Record<ErrLevel, { badge: string; dot: string }> = {
    CRITICAL: { badge: 'bg-red-500/20 text-red-400 border border-red-500/30', dot: 'bg-red-500' },
    ERROR: { badge: 'bg-orange-500/20 text-orange-400 border border-orange-500/30', dot: 'bg-orange-500' },
    WARN: { badge: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30', dot: 'bg-yellow-500' },
};

// ─── Static mock data ────────────────────────────────────────────────────────

const INITIAL_LOGS: LogEntry[] = [
    { id: 1, time: '10:05:22', level: 'INFO', message: "User 'tung.moderator@hust.edu.vn' logged in." },
    { id: 2, time: '10:07:15', level: 'WARN', message: 'Redis connection slow (latency 105ms).' },
    { id: 3, time: '10:12:01', level: 'ERR!', message: "Docker container 'jv-run-304' crashed. Reason: OOMKilled." },
    { id: 4, time: '10:12:05', level: 'INFO', message: 'Spawning new Java 17 worker... OK.' },
    { id: 5, time: '10:15:33', level: 'INFO', message: 'Submission #15420 received. Enqueued.' },
    { id: 6, time: '10:15:34', level: 'INFO', message: 'Waiting for events...', pulse: true },
];

const LEVEL_STYLE: Record<LogLevel, string> = {
    INFO: 'text-slate-400',
    WARN: 'text-yellow-500',
    'ERR!': 'text-red-500',
};

// ─── Sidebar Nav Item ─────────────────────────────────────────────────────────

const SidebarLink = ({
    href, icon: Icon, label, active,
}: {
    href: string; icon: React.ElementType; label: string; active?: boolean;
}) => (
    <Link
        to={href}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all
            ${active
                ? 'bg-red-500 text-white shadow-[0_4px_14px_0_rgba(239,68,68,0.3)]'
                : 'text-slate-400 hover:bg-red-500/10 hover:text-red-400'}`}
    >
        <Icon weight="duotone" className="text-xl shrink-0" />
        {label}
    </Link>
);


// ─── Main Component ───────────────────────────────────────────────────────────

export const AdminDashboardPage: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const logEndRef = useRef<HTMLDivElement>(null);
    const isFirstTrendRender = useRef(true); // skip initial mount — data comes from getStats

    const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
    const [totalUsers, setTotalUsers] = useState<number | null>(null);
    const [totalProblems, setTotalProblems] = useState<number | null>(null);
    const [totalSubmissions, setTotalSubmissions] = useState<number | null>(null);
    const [activeLanguages, setActiveLanguages] = useState<number | null>(null);
    const [totalLanguages, setTotalLanguages] = useState<number | null>(null);
    const [submissionTrend, setSubmissionTrend] = useState<HourlySubmissionDTO[]>([]);
    const [verdictStats, setVerdictStats] = useState<VerdictStatsDTO[]>([]);
    const [activeContests, setActiveContests] = useState<ActiveContestDTO[]>([]);
    const [trendRange, setTrendRange] = useState<string>('24h');
    const [trendLoading, setTrendLoading] = useState(false);
    // Date range picker state
    const today = new Date().toISOString().split('T')[0];
    const [dateFrom, setDateFrom] = useState<string>(() => {
        const d = new Date(); d.setDate(d.getDate() - 7);
        return d.toISOString().split('T')[0];
    });
    const [dateTo, setDateTo] = useState<string>(today);
    const [statsLoading, setStatsLoading] = useState(true);

    // Fetch admin stats (one-time on mount)
    useEffect(() => {
        adminDashboardApi.getStats()
            .then(data => {
                setTotalUsers(data.totalUsers);
                setTotalProblems(data.totalProblems);
                setTotalSubmissions(data.totalSubmissions);
                setActiveLanguages(data.activeLanguages);
                setTotalLanguages(data.totalLanguages);
                setSubmissionTrend(data.submissionTrend ?? []);
                setVerdictStats(data.verdictStats ?? []);
                setActiveContests(data.activeContests ?? []);
            })
            .catch(console.error)
            .finally(() => setStatsLoading(false));
    }, []);

    // Fetch trend riêng khi đổi khoảng thời gian (skip lần mount đầu)
    useEffect(() => {
        if (isFirstTrendRender.current) { isFirstTrendRender.current = false; return; }
        if (trendRange === 'custom') return;
        setTrendLoading(true);
        adminDashboardApi.getTrend(trendRange)
            .then(data => setSubmissionTrend(data))
            .catch(console.error)
            .finally(() => setTrendLoading(false));
    }, [trendRange]);

    const applyDateRange = () => {
        if (!dateFrom || !dateTo || dateFrom > dateTo) return;
        setTrendRange('custom');
        setTrendLoading(true);
        adminDashboardApi.getTrendByRange(dateFrom, dateTo)
            .then(data => setSubmissionTrend(data))
            .catch(console.error)
            .finally(() => setTrendLoading(false));
    };

    // ── Auto-refresh trend every 30s (only when tab visible & not custom mode) ─
    const REFRESH_INTERVAL = 15;
    const [refreshCountdown, setRefreshCountdown] = useState(REFRESH_INTERVAL);

    useEffect(() => {
        if (trendRange === 'custom') return;

        const fetchTrend = () => {
            if (document.hidden) return; // skip if tab not visible
            adminDashboardApi.getTrend(trendRange)
                .then(data => setSubmissionTrend(data))
                .catch(console.error);
        };

        // Countdown ticker (every 1s)
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

    // Auto-scroll logs to bottom
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    // Simulate live log stream
    useEffect(() => {
        let counter = INITIAL_LOGS.length + 1;
        const messages: { level: LogLevel; message: string }[] = [
            { level: 'INFO', message: 'Health check passed. All services nominal.' },
            { level: 'INFO', message: 'Submission #15421 graded: AC (Java 17, 312ms).' },
            { level: 'WARN', message: 'CPU spike detected on Node 2 (89%).' },
            { level: 'INFO', message: 'New user registered: user@example.com.' },
            { level: 'INFO', message: 'Backup completed successfully.' },
        ];
        let idx = 0;

        const interval = setInterval(() => {
            if (idx >= messages.length) { clearInterval(interval); return; }
            const now = new Date();
            const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
            setLogs(prev => [...prev.map(l => ({ ...l, pulse: false })), { id: counter++, time, ...messages[idx], pulse: idx === messages.length - 1 }]);
            idx++;
        }, 3500);

        return () => clearInterval(interval);
    }, []);

    const handleLogout = () => {
        navigate('/');
        setTimeout(() => dispatch(logout()), 10);
    };

    return (
        <div className="antialiased h-screen flex overflow-hidden bg-[#0f172a] text-slate-50 font-sans selection:bg-red-500/30">

            {/* ── Sidebar ────────────────────────────────────────────────── */}
            <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col pt-6 pb-4 shrink-0 z-20">
                {/* Logo */}
                <div className="px-6 mb-8 mt-2 text-xl font-bold tracking-tight text-white flex gap-2 items-center">
                    <div className="w-8 h-8 rounded bg-red-600 flex items-center justify-center shadow-lg shadow-red-500/20">
                        <HardDrives weight="bold" className="text-lg text-white" />
                    </div>
                    CodeArena<span className="text-red-500 text-sm align-top ml-1 font-mono">ADMIN</span>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-4 space-y-1">
                    <SidebarLink href="/admin/dashboard" icon={SquaresFour} label="System Dashboard" active />
                    <SidebarLink href="/admin/users" icon={Users} label="Quản lý Users" />
                    <SidebarLink href="/admin/languages" icon={Cpu} label="Cấu hình Máy chấm" />
                    <SidebarLink href="/admin/tags" icon={Tag} label="Phân loại (Tags)" />
                </nav>

                {/* Logout */}
                <div className="px-4 mt-4 border-t border-slate-800 pt-4">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors font-medium"
                    >
                        <SignOut weight="bold" className="text-xl" />
                        Đăng xuất
                    </button>
                </div>
            </aside>

            {/* ── Main ───────────────────────────────────────────────────── */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-900">

                {/* Header */}
                <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex justify-between items-center px-8 z-10 sticky top-0 shrink-0">
                    <h1 className="text-xl font-semibold text-white">System Monitoring</h1>

                    <div className="flex items-center gap-4">
                        <div className="h-6 w-px bg-slate-700" />
                        {/* Profile */}
                        <div className="relative flex items-center gap-3 cursor-pointer hover:bg-slate-800 p-2 rounded-lg transition">
                            <div className="text-right hidden sm:block">
                                <div className="text-sm font-semibold text-white leading-tight">{user?.fullName || 'System Admin'}</div>
                                <div className="text-xs text-slate-400 font-mono">ID: {user?.id || 1}</div>
                            </div>
                            <Avatar
                                src={user?.avatarUrl}
                                userId={user?.id}
                                size="md"
                                borderColor="border-red-500"
                            />
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">

                    {/* ── Summary Banner ──────────────────────────────────── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">

                        {/* Tổng User */}
                        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 hover:border-blue-500/50 transition relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 text-blue-500/8 group-hover:text-blue-500/15 transition-colors pointer-events-none">
                                <Users weight="fill" className="text-8xl" />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-slate-400 font-medium mb-1 text-sm">Tổng User</h3>
                                <div className="text-3xl font-bold text-white mb-2 font-mono">
                                    {statsLoading
                                        ? <span className="inline-block w-20 h-8 bg-slate-700 animate-pulse rounded" />
                                        : (totalUsers ?? 0).toLocaleString()}
                                </div>
                            </div>
                        </div>

                        {/* Tổng số bài tập */}
                        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 hover:border-emerald-500/50 transition relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 text-emerald-500/8 group-hover:text-emerald-500/15 transition-colors pointer-events-none">
                                <FileText weight="fill" className="text-8xl" />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-slate-400 font-medium mb-1 text-sm">Tổng số bài tập</h3>
                                <div className="text-3xl font-bold text-white mb-2 font-mono">
                                    {statsLoading
                                        ? <span className="inline-block w-20 h-8 bg-slate-700 animate-pulse rounded" />
                                        : (totalProblems ?? 0).toLocaleString()}
                                </div>
                            </div>
                        </div>

                        {/* Số máy chấm đang chạy */}
                        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 hover:border-yellow-500/50 transition relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 text-yellow-500/8 group-hover:text-yellow-500/15 transition-colors pointer-events-none">
                                <Desktop weight="fill" className="text-8xl" />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-slate-400 font-medium mb-1 text-sm">Máy chấm sẵn sàng</h3>
                                <div className="text-3xl font-bold text-white mb-2">
                                    {statsLoading
                                        ? <span className="inline-block w-20 h-8 bg-slate-700 animate-pulse rounded" />
                                        : <>
                                            {activeLanguages ?? 0}
                                            <span className="text-sm font-sans text-slate-500 ml-1">
                                                / {totalLanguages ?? 0} ngôn ngữ
                                            </span>
                                        </>}
                                </div>
                            </div>
                        </div>

                        {/* Tổng bài nộp đã chấm */}
                        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 hover:border-purple-500/50 transition relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 text-purple-500/8 group-hover:text-purple-500/15 transition-colors pointer-events-none">
                                <ChartDonut weight="fill" className="text-8xl" />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-slate-400 font-medium mb-1 text-sm">Tổng bài nộp đã chấm</h3>
                                <div className="text-3xl font-bold text-white mb-2 font-mono">
                                    {statsLoading
                                        ? <span className="inline-block w-20 h-8 bg-slate-700 animate-pulse rounded" />
                                        : (totalSubmissions ?? 0).toLocaleString()}
                                </div>
                            </div>
                        </div>

                    </div>


                    {/* ── Charts ───────────────────────────────────────────── */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">

                        {/* Submission Trend - Line/Area chart (2/3 width) */}
                        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 xl:col-span-2">
                            <div className="flex items-center gap-2 mb-5 flex-wrap">
                                <ChartLine weight="duotone" className="text-2xl text-blue-400 shrink-0" />
                                <h3 className="text-base font-bold text-white">
                                    Submission Trend –&nbsp;
                                    <span className="text-blue-400">
                                        {trendRange === '7d' ? '7 ngày' : trendRange === 'custom' ? 'Tùy chọn' : 'Hôm nay'}
                                    </span>
                                </h3>
                                {(statsLoading || trendLoading) && (
                                    <span className="text-xs font-normal text-slate-500 font-mono animate-pulse">loading...</span>
                                )}
                                {!trendLoading && trendRange !== 'custom' && (
                                    <span className="text-xs text-slate-600 font-mono" title="Auto-refresh">
                                        ↻ {refreshCountdown}s
                                    </span>
                                )}
                                {/* Tab filter */}
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

                            {/* Date range picker — chỉ hiện khi chọn Tùy chọn */}
                            {trendRange === 'custom' && (
                                <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-slate-900/60 rounded-xl border border-slate-700">
                                    <span className="text-xs text-slate-400 font-medium shrink-0">Từ ngày</span>
                                    <input
                                        type="date"
                                        value={dateFrom}
                                        max={dateTo}
                                        onChange={e => setDateFrom(e.target.value)}
                                        className="bg-slate-800 border border-slate-600 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 transition"
                                    />
                                    <span className="text-xs text-slate-400 font-medium shrink-0">đến ngày</span>
                                    <input
                                        type="date"
                                        value={dateTo}
                                        min={dateFrom}
                                        max={today}
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
                                        <linearGradient id="submGrad" x1="0" y1="0" x2="0" y2="1">
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
                                        type="monotone"
                                        dataKey="total"
                                        stroke="#3b82f6"
                                        strokeWidth={2.5}
                                        fill="url(#submGrad)"
                                        dot={false}
                                        activeDot={{ r: 5, fill: '#3b82f6', strokeWidth: 0 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Verdict Pie (1/3 width) */}
                        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 flex flex-col">
                            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-5">
                                <ChartDonut weight="duotone" className="text-2xl text-emerald-400" />
                                Tỉ lệ kết quả
                                {statsLoading && <span className="ml-auto text-xs text-slate-500 font-mono animate-pulse">loading...</span>}
                            </h3>
                            <div className="flex-1 flex flex-col items-center">
                                {verdictStats.length === 0 && !statsLoading ? (
                                    <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">Chưa có dữ liệu</div>
                                ) : (
                                    <>
                                        <ResponsiveContainer width="100%" height={180}>
                                            <PieChart>
                                                <Pie
                                                    data={verdictStats}
                                                    cx="50%" cy="50%"
                                                    innerRadius={52} outerRadius={78}
                                                    paddingAngle={3}
                                                    dataKey="value"
                                                    strokeWidth={0}
                                                    isAnimationActive={false}
                                                >
                                                    {verdictStats.map((entry, i) => (
                                                        <Cell key={i} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip
                                                    contentStyle={{ background: '#abc4ffff', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                                                    formatter={(v: number, name: string) => [`${v} bài`, name]}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        {/* Legend */}
                                        <div className="mt-2 w-full space-y-1.5">
                                            {verdictStats.map((d) => (
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

                    {/* ── Bottom: Active Contests ───────────────────────── */}
                    <div className="mt-2">

                        {/* Active Contests */}
                        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <Trophy weight="duotone" className="text-yellow-400 text-xl" />
                                    Cuộc thi đang chạy
                                </h3>
                                {statsLoading
                                    ? <span className="text-xs font-mono text-slate-500 animate-pulse">loading...</span>
                                    : <span className="text-xs font-mono text-slate-500">{activeContests.length} contest</span>
                                }
                            </div>
                            <div className="divide-y divide-slate-700/60">
                                {!statsLoading && activeContests.length === 0 && (
                                    <div className="px-6 py-8 text-center text-slate-600 text-sm">Không có cuộc thi nào hôm nay</div>
                                )}
                                {activeContests.map(c => {
                                    const fmt = (iso: string) => new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                                    return (
                                        <div key={c.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-slate-700/30 transition">
                                            {/* Status dot */}
                                            <span className={`w-2 h-2 rounded-full shrink-0 ${c.status === 'active' ? 'bg-green-400 shadow-[0_0_6px_2px_rgba(74,222,128,0.4)]' : 'bg-yellow-400'
                                                }`} />
                                            {/* Name + time */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-white truncate">{c.title}</p>
                                                <p className="text-xs text-slate-500 font-mono mt-0.5">{fmt(c.startTime)} → {fmt(c.endTime)}</p>
                                            </div>
                                            {/* Badges */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">
                                                    👥 {c.participants}
                                                </span>
                                                <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">
                                                    📄 {c.problems} bài
                                                </span>
                                                <span className={`text-xs px-2 py-0.5 rounded font-semibold ${c.status === 'active'
                                                        ? 'bg-green-500/15 text-green-400 border border-green-500/25'
                                                        : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25'
                                                    }`}>
                                                    {c.status === 'active' ? '● Live' : '⏳ Soon'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                    </div>

                </div>
            </main>
        </div>
    );
};
