import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    CaretLeft, CaretRight, Crown, MagnifyingGlass, Medal
} from '@phosphor-icons/react';
import { RootState } from '../../../../app/store';
import { getLeaderboard, LeaderboardUserResponse } from '../services/leaderboardService';
import toast from 'react-hot-toast';
import { UserLayout } from '../../../../layouts/UserLayout';
import { Avatar } from '../../../../shared/components/Avatar';
import UserNameWithRank from '../../../../shared/components/UserNameWithRank';

export const LeaderboardPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);
    const [users, setUsers] = useState<LeaderboardUserResponse[]>([]);
    const [top3, setTop3] = useState<LeaderboardUserResponse[]>([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(true);

    const size = 10;

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const data = await getLeaderboard(search, page, size);
            setUsers(data.content);
            setTotalPages(data.totalPages);
            setTotalElements(data.totalElements);

            // Fetch Top 3 for the podium if no search is active
            if (search.trim() === '') {
                if (page === 0) {
                    setTop3(data.content.slice(0, 3));
                } else if (top3.length === 0) {
                    // If we start on a page other than 0, fetch the top 3 separately
                    const topData = await getLeaderboard('', 0, 3);
                    setTop3(topData.content);
                }
            }
        } catch (error) {
            console.error('Failed to fetch leaderboard', error);
            toast.error('Không thể tải dữ liệu bảng xếp hạng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchLeaderboard();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [search, page]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(0); // Reset page on search
    };

    const renderPodium = () => {
        if (top3.length === 0) return null;

        const firstPlace = top3[0];
        const secondPlace = top3[1];
        const thirdPlace = top3[2];

        return (
            <div className="flex justify-center items-end gap-2 md:gap-6 w-full max-w-2xl mx-auto mb-16 h-64 mt-16 relative z-10">
                {/* 2nd Place */}
                {secondPlace && (
                    <div className="flex flex-col items-center w-1/3 relative group animate-fade-in-up delay-100">
                        <div className="absolute -top-10 text-2xl text-slate-400 font-bold opacity-50 group-hover:opacity-100 transition">
                            <Medal weight="fill" className="text-slate-400" />
                        </div>
                        <Avatar
                            src={secondPlace.avatarUrl}
                            userId={secondPlace.userId}
                            size="xl"
                            alt={secondPlace.username}
                            borderColor="border-slate-400"
                            className="mb-3 z-10 bg-slate-800 shadow-[0_0_15px_rgba(148,163,184,0.4)]"
                            onClick={() => navigate(`/profile/${secondPlace.userId}`)}
                        />
                        <span
                            className="font-bold text-white text-sm md:text-base truncate w-full px-2 text-center cursor-pointer hover:text-blue-400 transition-colors"
                            onClick={() => navigate(`/profile/${secondPlace.userId}`)}
                        >
                            {secondPlace.fullName || secondPlace.username}
                        </span>
                        <div className="flex justify-center mb-1">
                            <UserNameWithRank username={secondPlace.username} globalRating={secondPlace.globalRating} className="text-xs" />
                        </div>
                        <span className="text-xs text-blue-400 font-mono mb-2">{secondPlace.globalRating} ELO</span>
                        <div className="w-full h-[100px] border-t-2 border-slate-400 bg-gradient-to-b from-slate-400/20 to-transparent rounded-t-xl flex justify-center items-start pt-4 shadow-xl">
                            <span className="text-4xl font-black text-slate-500/50">2</span>
                        </div>
                    </div>
                )}

                {/* 1st Place */}
                {firstPlace && (
                    <div className="flex flex-col items-center w-1/3 relative group animate-fade-in-up text-center">
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-3xl text-yellow-500 font-bold animate-bounce shadow-yellow-500/50">
                            <Crown weight="fill" />
                        </div>
                        <Avatar
                            src={firstPlace.avatarUrl}
                            userId={firstPlace.userId}
                            size={80} // md:w-24 would be 96, handling responsive with custom size if needed, but keeping it simple
                            alt={firstPlace.username}
                            borderColor="border-yellow-500"
                            className="mb-3 z-10 bg-slate-800 shadow-[0_0_20px_rgba(234,179,8,0.5)]"
                            onClick={() => navigate(`/profile/${firstPlace.userId}`)}
                        />
                        <span
                            className="font-bold text-white text-base md:text-lg truncate w-full px-2 cursor-pointer hover:text-yellow-400 transition-colors"
                            onClick={() => navigate(`/profile/${firstPlace.userId}`)}
                        >
                            {firstPlace.fullName || firstPlace.username}
                        </span>
                        <div className="flex justify-center mb-1">
                            <UserNameWithRank username={firstPlace.username} globalRating={firstPlace.globalRating} className="text-sm" />
                        </div>
                        <div className="flex justify-center mb-2">
                            <span className="text-xs text-yellow-400 font-bold font-mono bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">
                                {firstPlace.globalRating} ELO
                            </span>
                        </div>
                        <div className="w-full h-[140px] border-t-2 border-yellow-500 bg-gradient-to-b from-yellow-500/20 to-transparent rounded-t-xl flex justify-center items-start pt-6 shadow-xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-yellow-500/10 w-full h-full"></div>
                            <span className="text-5xl font-black text-yellow-600/50 z-10">1</span>
                        </div>
                    </div>
                )}

                {/* 3rd Place */}
                {thirdPlace && (
                    <div className="flex flex-col items-center w-1/3 relative group animate-fade-in-up delay-200">
                        <div className="absolute -top-10 text-2xl text-orange-600 font-bold opacity-50 group-hover:opacity-100 transition">
                            <Medal weight="fill" className="text-orange-600" />
                        </div>
                        <Avatar
                            src={thirdPlace.avatarUrl}
                            userId={thirdPlace.userId}
                            size="xl"
                            alt={thirdPlace.username}
                            borderColor="border-orange-600"
                            className="mb-3 z-10 bg-slate-800 shadow-[0_0_15px_rgba(194,65,12,0.4)]"
                            onClick={() => navigate(`/profile/${thirdPlace.userId}`)}
                        />
                        <span
                            className="font-bold text-white text-sm md:text-base truncate w-full px-2 text-center cursor-pointer hover:text-blue-400 transition-colors"
                            onClick={() => navigate(`/profile/${thirdPlace.userId}`)}
                        >
                            {thirdPlace.fullName || thirdPlace.username}
                        </span>
                        <div className="flex justify-center mb-1">
                            <UserNameWithRank username={thirdPlace.username} globalRating={thirdPlace.globalRating} className="text-xs" />
                        </div>
                        <span className="text-xs text-blue-400 font-mono mb-2">{thirdPlace.globalRating} ELO</span>
                        <div className="w-full h-[80px] border-t-2 border-orange-600 bg-gradient-to-b from-orange-600/20 to-transparent rounded-t-xl flex justify-center items-start pt-2 shadow-xl">
                            <span className="text-4xl font-black text-orange-700/50">3</span>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <UserLayout>
            <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl w-full flex flex-col z-10 relative">
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 pb-3 pt-3 mb-3 uppercase tracking-wider">Bảng Vàng</h1>
                    <p className="text-slate-400 text-lg mb-10">Vinh danh những lập trình viên xuất sắc nhất trên CodeArena</p>
                </div>

                {/* Show podium only if no search filter */}
                {search.trim() === '' && renderPodium()}

                {/* Table Container */}
                <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 w-full mb-8 relative z-10">
                    {/* Toolbar */}
                    <div className="p-5 border-b border-slate-700/50 flex flex-wrap gap-4 justify-between items-center bg-slate-800/30">
                        <div className="flex gap-2">
                            <span className="text-xl font-bold text-slate-200">Danh Sách Xếp Hạng</span>
                        </div>
                        <div className="relative w-full sm:w-72">
                            <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg" />
                            <input
                                type="text"
                                placeholder="Tìm theo tên hoặc email..."
                                value={search}
                                onChange={handleSearchChange}
                                className="w-full bg-slate-900/80 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 block pl-11 p-3 outline-none transition-all shadow-inner"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto relative min-h-[400px]">
                        {loading && (
                            <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center z-20 backdrop-blur-sm">
                                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                        <table className="w-full text-sm text-left text-slate-400">
                            <thead className="text-xs uppercase bg-slate-900/50 text-slate-300 border-b border-slate-700 py-4">
                                <tr>
                                    <th className="px-6 py-5 text-center w-20 font-bold tracking-wider">Hạng</th>
                                    <th className="px-6 py-5 font-bold tracking-wider">Lập trình viên</th>
                                    <th className="px-6 py-5 font-bold tracking-wider text-center hidden md:table-cell">AC / Số Bài</th>
                                    <th className="px-6 py-5 font-bold tracking-wider text-center hidden sm:table-cell">Tỉ lệ AC</th>
                                    <th className="px-6 py-5 font-bold tracking-wider text-right">Điểm ELO</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {users.length > 0 ? users.map((u) => (
                                    <tr key={u.userId} className={`hover:bg-slate-800/80 transition-colors group ${u.userId === user?.id ? 'bg-blue-900/20 border-l-4 border-blue-500' : 'border-l-4 border-transparent'}`}>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold
                                                ${u.rank === 1 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.3)]'
                                                    : u.rank === 2 ? 'bg-slate-400/20 text-slate-300 border border-slate-400/50 shadow-[0_0_10px_rgba(148,163,184,0.3)]'
                                                        : u.rank === 3 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.3)]'
                                                            : 'text-slate-400 font-mono text-base'}`}>
                                                {u.rank <= 3 ? '#' + u.rank : u.rank}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-white flex items-center gap-4">
                                            <div className="relative">
                                                <Avatar
                                                    src={u.avatarUrl}
                                                    userId={u.userId}
                                                    size="md"
                                                    alt={u.username}
                                                    borderColor="border-slate-600"
                                                    className="group-hover:scale-110 transition-transform bg-slate-900"
                                                />
                                                {u.rank === 1 && <Crown weight="fill" className="absolute -top-2 -right-2 text-yellow-500 text-lg drop-shadow-md" />}
                                            </div>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1 flex-wrap">
                                                    <UserNameWithRank
                                                        username={u.fullName || u.username}
                                                        globalRating={u.globalRating}
                                                        className={`text-base transition-colors cursor-pointer hover:text-blue-400 ${u.userId === user?.id ? 'text-blue-400' : ''}`}
                                                    />
                                                    {u.userId === user?.id && <span className="text-xs ml-1 bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">Bạn</span>}
                                                </div>
                                                <span className="text-xs text-slate-500 font-mono">{u.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center hidden md:table-cell font-mono">
                                            <span className="text-emerald-400 font-bold">{u.solvedCount}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center hidden sm:table-cell font-mono">
                                            <div className="flex items-center justify-center gap-2">
                                                <span className={u.acRate >= 50 ? 'text-emerald-400' : u.acRate >= 20 ? 'text-yellow-400' : 'text-rose-400'}>{u.acRate}%</span>
                                                <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${u.acRate >= 50 ? 'bg-emerald-500' : u.acRate >= 20 ? 'bg-yellow-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(100, u.acRate)}%` }}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`text-base font-black font-mono tracking-wider drop-shadow-sm
                                                ${u.rank === 1 ? 'text-yellow-400' : u.rank === 2 ? 'text-slate-300' : u.rank === 3 ? 'text-orange-400'
                                                    : u.globalRating >= 1000 ? 'text-red-400' : u.globalRating >= 700 ? 'text-yellow-400' : u.globalRating >= 450 ? 'text-purple-400' : u.globalRating >= 250 ? 'text-blue-400' : u.globalRating >= 100 ? 'text-green-400' : 'text-slate-300'}`}>
                                                {u.globalRating}
                                            </span>
                                        </td>
                                    </tr>
                                )) : !loading && (
                                    <tr>
                                        <td colSpan={5} className="py-16 text-center text-slate-500">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <MagnifyingGlass className="text-4xl text-slate-600" />
                                                <span className="text-lg">Không tìm thấy lập trình viên nào.</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="p-5 border-t border-slate-700/50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/30">
                        <span className="text-sm text-slate-400">
                            Hiển thị <span className="font-bold text-white">{users.length > 0 ? page * size + 1 : 0}</span> đến <span className="font-bold text-white">{Math.min((page + 1) * size, totalElements)}</span> của <span className="font-bold text-white">{totalElements}</span> Coders
                        </span>

                        {totalPages > 1 && (
                            <div className="flex gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/50 shadow-inner">
                                <button
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    disabled={page === 0}
                                    className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition text-sm disabled:opacity-30 disabled:hover:bg-slate-800 font-bold flex items-center"
                                >
                                    <CaretLeft weight="bold" />
                                </button>

                                {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                                    let pageNum = page - 2 + idx;

                                    // Adjust start boundary if close to the beginning
                                    if (page < 2) {
                                        pageNum = idx;
                                    }
                                    // Adjust end boundary if close to the end
                                    else if (page > totalPages - 3) {
                                        pageNum = Math.max(0, totalPages - 5) + idx;
                                    }

                                    // Final safety check
                                    pageNum = Math.max(0, Math.min(pageNum, totalPages - 1));

                                    // Calculate if we should render this specifically (React key uniquely maps elements)
                                    return (
                                        <React.Fragment key={`page-${pageNum}`}>
                                            <button
                                                onClick={() => setPage(pageNum)}
                                                className={`w-9 h-8 rounded-lg transition text-sm font-bold flex items-center justify-center ${page === pageNum ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                                            >
                                                {pageNum + 1}
                                            </button>
                                        </React.Fragment>
                                    );
                                }).filter((item, index, self) =>
                                    // Filter out duplicate pageNum renders
                                    index === self.findIndex((t) => (t?.key === item?.key))
                                )}

                                <button
                                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                    disabled={page >= totalPages - 1}
                                    className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition text-sm disabled:opacity-30 disabled:hover:bg-slate-800 font-bold flex items-center"
                                >
                                    <CaretRight weight="bold" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </UserLayout>
    );
};

export default LeaderboardPage;
