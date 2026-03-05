import React, { useEffect, useState } from 'react';
import { LeaderboardDTO, leaderboardApiService } from '../services/leaderboardApiService';
import { useLeaderboardSocket } from '../hooks/useLeaderboardSocket';
import { Trophy, Medal, CircleNotch, Timer, CheckCircle, Star, Info } from '@phosphor-icons/react';
import { toast } from 'react-hot-toast';

interface LeaderboardTabProps {
    contestId: number;
}

// Tính lại rank từ problemDetails (luôn fresh từ submissions, không phụ thuộc DB stale)
export const computeAndSort = (data: LeaderboardDTO[]) => {
    const enriched = data.map(user => {
        const details = user.problemDetails ?? [];
        const accepted = details.filter(p => p.isAccepted);
        const computedSolved = accepted.length;

        // Thời gian tích lũy ICPC: tổng penaltyMinutes của các bài đã AC + 1000 nếu vi phạm
        let computedPenalty = accepted.reduce((sum, p) => sum + (p.penaltyMinutes ?? 0), 0);
        if (user.hasScorePenalty) {
            computedPenalty += 1000;
        }

        // Tổng điểm thực tế = Σ score của TẤT CẢ các bài (bao gồm cả WA partial)
        const computedPoints = details.reduce((sum, p) => sum + (p.score ?? 0), 0);
        return { ...user, computedSolved, computedPenalty, computedPoints, computedRank: 0 };
    });

    // Sort: Tổng điểm (DESC) -> Số bài AC (DESC) -> Penalty (ASC)
    enriched.sort((a, b) => {
        if (b.computedPoints !== a.computedPoints) return b.computedPoints - a.computedPoints;
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
                                <Star size={13} /> Điểm theo test case
                            </span>
                            <span className="text-slate-400">Mỗi test case có trọng số (scoreWeight). Điểm mỗi bài = tổng scoreWeight các test <strong className="text-slate-300">pass</strong>. Điểm cuộc thi = tổng điểm tất cả bài.</span>
                        </div>
                        <div className="bg-slate-800/60 rounded-xl p-3 flex flex-col gap-1">
                            <span className="text-yellow-400 font-semibold flex items-center gap-1">
                                <Timer size={13} /> Thời gian tích lũy
                            </span>
                            <span className="text-slate-400">
                                Chỉ tính cho bài đã <strong className="text-slate-300">AC hoàn toàn</strong>: thời gian từ lúc thi đến khi giải đúng + <strong className="text-slate-300">20 phút</strong> cho mỗi lần nộp sai.
                            </span>
                        </div>
                        <div className="bg-slate-800/60 rounded-xl p-3 flex flex-col gap-1">
                            <span className="text-blue-400 font-semibold flex items-center gap-1">
                                <Trophy size={13} /> Thứ hạng
                            </span>
                            <span className="text-slate-400">
                                Ưu tiên: <strong className="text-slate-300">Tổng điểm cao hơn</strong> → <strong className="text-slate-300">Số bài AC nhiều hơn</strong> → <strong className="text-slate-300">Thời gian ít hơn</strong>.
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
                                    <div className="text-[10px] text-slate-600 normal-case tracking-normal font-normal">theo test case</div>
                                </th>
                                <th className="py-3 px-4 text-center w-28">
                                    <div>Bài giải được</div>
                                    <div className="text-[10px] text-slate-600 normal-case tracking-normal font-normal">giải đúng</div>
                                </th>
                                <th className="py-3 px-4 text-center w-40">
                                    <div className="flex items-center gap-1 justify-center"><Timer size={11} />Thời gian tích lũy</div>
                                    <div className="text-[10px] text-slate-600 normal-case tracking-normal font-normal">ít hơn = tốt hơn</div>
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
                                                                const allProblems = user.problemDetails ?? [];
                                                                const sortedProblems = [...allProblems].sort((a, b) => a.problemId - b.problemId);
                                                                const trueIndex = sortedProblems.findIndex(pd => pd.problemId === p.problemId);
                                                                const label = trueIndex >= 0 ? trueIndex + 1 : '?';
                                                                const penalty = p.penaltyMinutes ?? 0;
                                                                return (
                                                                    <span
                                                                        key={p.problemId}
                                                                        title={`Bài ${label}: ${p.score ?? 0}đ | penalty ${formatMinutes(penalty)}${p.failedAttempts > 0 ? ` (${p.failedAttempts} lần sai ×20p)` : ''}`}
                                                                        className="px-2 py-0.5 text-[10px] bg-slate-700/60 text-slate-400 rounded-md border border-slate-600/50 font-mono cursor-help hover:bg-slate-700 transition-colors"
                                                                    >
                                                                        B{label}: {p.score ?? 0}/{p.maxScore ?? '?'}
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
