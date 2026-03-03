import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../app/store';
import { ModeratorLayout } from '../../components/ModeratorLayout';
import {
    Users,
    CalendarStar,
    WarningCircle,
    TrendUp,
    CircleNotch,
    Trophy
} from '@phosphor-icons/react';
import {
    moderatorDashboardService,
    ModeratorDashboardStats
} from '../services/moderatorDashboardService';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export const ModDashboardPage = () => {
    const user = useSelector((state: RootState) => state.auth.user);
    const [stats, setStats] = useState<ModeratorDashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await moderatorDashboardService.getDashboardStats();
                setStats(data);
            } catch (error) {
                console.error('Lỗi khi tải dữ liệu thống kê:', error);
                toast.error('Không thể tải dữ liệu thống kê. Vui lòng thử lại sau.');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

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
