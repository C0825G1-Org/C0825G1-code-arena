import { useSelector } from 'react-redux';
import { RootState } from '../../../../app/store';
import { ModeratorLayout } from '../../layouts/ModeratorLayout';
import {
    Users,
    CalendarStar,
    BookOpenText,
    TrendUp
} from '@phosphor-icons/react';

export const ModDashboardPage = () => {
    const user = useSelector((state: RootState) => state.auth.user);

    return (
        <ModeratorLayout>
            <div className="max-w-7xl mx-auto w-full space-y-8 animate-fade-in-up">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Thống Kê Tổng Quan</h1>
                    <p className="text-slate-400">
                        Chào mừng {user?.fullName || user?.username} trở lại CodeMod. Xin lưu ý các số liệu dưới đây đang trong quá trình phát triển (Sắp ra mắt).
                    </p>
                </div>

                {/* Main Stats (Placeholders) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-slate-800/40 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 hover:border-purple-500/30 transition-colors relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Users weight="duotone" className="text-6xl text-purple-400" />
                        </div>
                        <h3 className="text-slate-400 font-medium mb-1">Tổng Người Dùng</h3>
                        <div className="text-4xl font-bold text-white mb-2">—</div>
                        <div className="text-sm border border-slate-600 text-slate-400 inline-block px-2 py-0.5 rounded text-xs bg-slate-800/50">Sắp ra mắt</div>
                    </div>

                    <div className="bg-slate-800/40 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 hover:border-blue-500/30 transition-colors relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <CalendarStar weight="duotone" className="text-6xl text-blue-400" />
                        </div>
                        <h3 className="text-slate-400 font-medium mb-1">Tổng Cuộc Thi</h3>
                        <div className="text-4xl font-bold text-white mb-2">—</div>
                        <div className="text-sm border border-slate-600 text-slate-400 inline-block px-2 py-0.5 rounded text-xs bg-slate-800/50">Sắp ra mắt</div>
                    </div>

                    <div className="bg-slate-800/40 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 hover:border-emerald-500/30 transition-colors relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <BookOpenText weight="duotone" className="text-6xl text-emerald-400" />
                        </div>
                        <h3 className="text-slate-400 font-medium mb-1">Tổng Bài Tập</h3>
                        <div className="text-4xl font-bold text-white mb-2">—</div>
                        <div className="text-sm border border-slate-600 text-slate-400 inline-block px-2 py-0.5 rounded text-xs bg-slate-800/50">Sắp ra mắt</div>
                    </div>

                    <div className="bg-slate-800/40 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 hover:border-orange-500/30 transition-colors relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <TrendUp weight="duotone" className="text-6xl text-orange-400" />
                        </div>
                        <h3 className="text-slate-400 font-medium mb-1">Lượt Nộp Bài</h3>
                        <div className="text-4xl font-bold text-white mb-2">—</div>
                        <div className="text-sm border border-slate-600 text-slate-400 inline-block px-2 py-0.5 rounded text-xs bg-slate-800/50">Sắp ra mắt</div>
                    </div>
                </div>

                {/* Recent Activities (Placeholder) */}
                <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 flex-1 min-h-[300px]">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <TrendUp weight="bold" className="text-purple-400" /> Hoạt Động Gần Đây
                    </h2>
                    <div className="flex flex-col items-center justify-center h-48 text-slate-500 border-2 border-dashed border-slate-700/50 rounded-xl">
                        <p>Tính năng xem nhật ký hoạt động đang được phát triển.</p>
                        <p className="text-sm mt-1">Sắp ra mắt!</p>
                    </div>
                </div>
            </div>
        </ModeratorLayout>
    );
};
