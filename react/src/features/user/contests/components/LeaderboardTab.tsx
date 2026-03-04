import React, { useEffect, useState } from 'react';
import { LeaderboardDTO, leaderboardApiService } from '../services/leaderboardApiService';
import { useLeaderboardSocket } from '../hooks/useLeaderboardSocket';
import { Trophy, Medal, CircleNotch, Timer, CheckCircle, Star, Info, UserCircle } from '@phosphor-icons/react';
import { toast } from 'react-hot-toast';

interface LeaderboardTabProps {
    contestId: number;
}

// Tính lại rank từ problemDetails (luôn fresh từ submissions, không phụ thuộc DB stale)
const computeAndSort = (data: LeaderboardDTO[]) => {
    const enriched = data.map(user => {
        const accepted = (user.problemDetails ?? []).filter(p => p.isAccepted);
        const computedSolved = accepted.length;
        const computedPenalty = accepted.reduce((sum, p) => sum + (p.score ?? 0), 0);
        // Tổng điểm = số bài giải × 100 điểm/bài
        const computedPoints = computedSolved * 100;
        return { ...user, computedSolved, computedPenalty, computedPoints, computedRank: 0 };
    });

    // Sort: điểm cao hơn → thắng; cùng điểm → thời gian ít hơn → thắng
    enriched.sort((a, b) => {
        if (b.computedSolved !== a.computedSolved) return b.computedSolved - a.computedSolved;
        return a.computedPenalty - b.computedPenalty;
    });

    enriched.forEach((u, i) => {
        u.computedRank = i + 1;
    });
    return enriched;
};

/** Quy phút sang giờ nếu lớn hơn 60 phút */
const formatMinutes = (minutes: number): string => {
    if (minutes < 60) return `${minutes} p`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}p` : `${h}h`;
};

const getRankStyle = (rank: number) => {
    if (rank === 1) return { row: 'bg-yellow-500/8 border-l-4 border-yellow-400', badge: 'text-yellow-400', medal: true };
    if (rank === 2) return { row: 'bg-slate-300/5 border-l-4 border-slate-400', badge: 'text-slate-300', medal: true };
    if (rank === 3) return { row: 'bg-amber-700/8 border-l-4 border-amber-600', badge: 'text-amber-500', medal: true };
    return {
        row: 'hover:bg-slate-800/30 transition-colors border-l-4 border-transparent',
        badge: 'text-slate-400',
        medal: false
    };
};

export const LeaderboardTab: React.FC<LeaderboardTabProps> = ({ contestId }) => {
    const [leaderboard, setLeaderboard] = useState<LeaderboardDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [showHelp, setShowHelp] = useState(false);

    useEffect(() => {
        const fetchBoard = async () => {
            setLoading(true);
            try {
                const data = await leaderboardApiService.getLeaderboard(contestId);
                setLeaderboard(data);
            } catch {
                toast.error('Không thể tải bảng xếp hạng');
            } finally {
                setLoading(false);
            }
        };
        fetchBoard();
    }, [contestId]);

    useLeaderboardSocket(contestId, (newData) => {
        setLeaderboard(newData);
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center p-12 text-blue-400">
                <CircleNotch weight="bold" className="text-4xl animate-spin" />
            </div>
        );
    }

    if (leaderboard.length === 0) {
        return (
            <div className="text-center p-12 bg-slate-800/20 rounded-2xl border border-slate-700/50">
                <Trophy weight="duotone" className="text-6xl text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">Chưa có ai ghi điểm trong cuộc thi này.</p>
                <p className="text-slate-500 text-sm mt-2">Hãy là người đầu tiên giải quyết bài tập!</p>
            </div>
        );
    }

    const sorted = computeAndSort(leaderboard);

    return (
        <div className="flex flex-col gap-4">
            {/* Hướng dẫn cách tính điểm */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl px-4 py-3">
                <button
                    className="flex items-center gap-2 w-full text-left"
                    onClick={() => setShowHelp(h => !h)}
                >
                    <Info size={16} className="text-blue-400 shrink-0" />
                    <span className="text-sm text-blue-300 font-medium">Cách tính điểm & xếp hạng</span>
                    <span className="ml-auto text-blue-500 text-xs">{showHelp ? 'Ẩn ▲' : 'Xem ▼'}</span>
                </button>
                {showHelp && (
                    <div className="mt-3 grid sm:grid-cols-3 gap-3 text-xs text-slate-300">
                        <div className="bg-slate-800/60 rounded-xl p-3 flex flex-col gap-1">
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                <Star size={13} /> Mỗi bài giải đúng = 100 điểm
                            </span>
                            <span className="text-slate-400">Giải đúng hoàn toàn tất cả test mới được tính điểm.</span>
                        </div>
                        <div className="bg-slate-800/60 rounded-xl p-3 flex flex-col gap-1">
                            <span className="text-yellow-400 font-semibold flex items-center gap-1">
                                <Timer size={13} /> Thời gian tích lũy
                            </span>
                            <span className="text-slate-400">
                                Thời gian từ lúc thi đến khi giải đúng, cộng thêm <strong className="text-slate-300">20 phút</strong> cho mỗi lần nộp sai trước đó.
                            </span>
                        </div>
                        <div className="bg-slate-800/60 rounded-xl p-3 flex flex-col gap-1">
                            <span className="text-blue-400 font-semibold flex items-center gap-1">
                                <Trophy size={13} /> Thứ hạng
                            </span>
                            <span className="text-slate-400">
                                Ai giải <strong className="text-slate-300">được nhiều bài hơn</strong> thì đứng trên.
                                Nếu bằng nhau, ai có <strong className="text-slate-300">thời gian ít hơn</strong> thì thắng.
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Bảng xếp hạng */}
            <div className="bg-slate-900/60 rounded-3xl border border-slate-700/50 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead
                            className="sticky top-0 z-10 bg-slate-800 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700">
                            <tr>
                                <th className="py-3 px-4 text-center w-14">Hạng</th>
                                <th className="py-3 px-5">Thí sinh</th>
                                <th className="py-3 px-4 text-center w-32">
                                    <div>Tổng điểm</div>
                                    <div className="text-[10px] text-slate-600 normal-case tracking-normal font-normal">100đ
                                        / bài
                                    </div>
                                </th>
                                <th className="py-3 px-4 text-center w-28">
                                    <div>Bài giải được</div>
                                    <div className="text-[10px] text-slate-600 normal-case tracking-normal font-normal">giải
                                        đúng
                                    </div>
                                </th>
                                <th className="py-3 px-4 text-center w-40">
                                    <div className="flex items-center gap-1 justify-center"><Timer size={11} />Thời gian tích
                                        lũy
                                    </div>
                                    <div className="text-[10px] text-slate-600 normal-case tracking-normal font-normal">ít
                                        hơn = tốt hơn
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/40">
                            {sorted.map((user) => {
                                const style = getRankStyle(user.computedRank);
                                const hasViolation = user.totalPenalty >= 1000;

                                return (
                                    <tr key={user.userId} className={style.row}>
                                        {/* Hạng */}
                                        <td className="py-4 px-4 text-center align-middle">
                                            {style.medal ? (
                                                <Medal weight="fill"
                                                    className={`text-2xl mx-auto drop-shadow-lg ${style.badge}`} />
                                            ) : (
                                                <span
                                                    className={`font-bold text-lg ${style.badge}`}>{user.computedRank}</span>
                                            )}
                                        </td>

                                        {/* Thí sinh */}
                                        <td className="py-4 px-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full shrink-0 overflow-hidden border-2 border-blue-500/40">
                                                    <img
                                                        src={user.avatarUrl || `https://i.pravatar.cc/150?u=${user.userId}`}
                                                        alt={user.username}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.onerror = null;
                                                            e.currentTarget.style.display = 'none';
                                                            e.currentTarget.parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-slate-400" viewBox="0 0 256 256" fill="currentColor"><path d="M172,120a44,44,0,1,1-44-44A44,44,0,0,1,172,120Zm60,8A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88,88.1,88.1,0,0,0,88-88Z"/></svg>';
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-100">{user.username}</div>
                                                    {user.fullName && (
                                                        <div className="text-xs text-slate-500">{user.fullName}</div>
                                                    )}
                                                </div>
                                                {hasViolation && (
                                                    <span
                                                        className="ml-1 text-[10px] px-2 py-0.5 bg-red-500/15 text-red-400 rounded-full border border-red-500/25">
                                                        Vi phạm ⚠️
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Tổng điểm */}
                                        <td className="py-4 px-4 text-center">
                                            <span
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/15 text-yellow-400 font-bold rounded-xl border border-yellow-500/25 text-lg leading-none">
                                                {user.computedPoints}
                                                <span className="text-[10px] text-yellow-600 font-normal">đ</span>
                                            </span>
                                        </td>

                                        {/* Số bài giải được */}
                                        <td className="py-4 px-4 text-center">
                                            <span
                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500/15 text-emerald-400 font-bold rounded-xl border border-emerald-500/25 text-base leading-none">
                                                <CheckCircle size={14} weight="fill" />
                                                {user.computedSolved}
                                            </span>
                                        </td>

                                        {/* Thời gian tích lũy */}
                                        <td className="py-4 px-4 text-center">
                                            <div className="flex flex-col items-center gap-1.5">
                                                <span
                                                    className={`font-mono font-semibold text-base ${hasViolation ? 'text-red-400' : 'text-slate-200'}`}>
                                                    {formatMinutes(user.computedPenalty)}
                                                </span>
                                                {/* Chi tiết từng bài - tooltip khi hover */}
                                                {user.problemDetails && user.problemDetails.filter(p => p.isAccepted).length > 0 && (
                                                    <div className="flex flex-wrap gap-1 justify-center">
                                                        {user.problemDetails
                                                            .filter(p => p.isAccepted)
                                                            .map((p) => {
                                                                // Tìm đúng vị trí bài trong danh sách gốc (chưa filter)
                                                                // để "B1, B2..." không bị nhảy số khi có bài chưa giải
                                                                const allProblems = user.problemDetails ?? [];
                                                                const sortedProblems = [...allProblems].sort((a, b) => a.problemId - b.problemId);
                                                                const trueIndex = sortedProblems.findIndex(pd => pd.problemId === p.problemId);
                                                                const label = trueIndex >= 0 ? trueIndex + 1 : '?';
                                                                return (
                                                                    <span
                                                                        key={p.problemId}
                                                                        title={`Bài ${label}: thời gian giải ${formatMinutes(p.solvedTimeMinutes)}${p.failedAttempts > 0 ? ` + ${p.failedAttempts} lần sai ×20 phút = ${formatMinutes(p.failedAttempts * 20)} phạt)` : ''}`}
                                                                        className="px-2 py-0.5 text-[10px] bg-slate-700/60 text-slate-400 rounded-md border border-slate-600/50 font-mono cursor-help hover:bg-slate-700 transition-colors"
                                                                    >
                                                                        B{label}: {formatMinutes(p.score)}
                                                                    </span>
                                                                );
                                                            })}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
