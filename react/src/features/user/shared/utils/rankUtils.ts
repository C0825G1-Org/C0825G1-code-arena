// Mỗi cấp bậc có emoji/icon riêng, được render qua CSS/text
// iconEmoji: dùng emoji lấp lánh, không cần thư viện thêm
// glowClass: tailwind class để thêm hiệu ứng glow
export interface RankTier {
    name: string;
    min: number;
    max: number;
    color: string;           // tailwind text color class
    bgGradient: string;      // tailwind gradient class
    textShadow: string;      // tailwind shadow class
    iconEmoji: string;       // emoji/unicode icon riêng cho cấp
    glowColor: string;       // CSS color cho drop-shadow
    badgeBg: string;         // tailwind bg class cho badge nền
}

export type RankType = 'contest' | 'practice' | 'total';

export const RANK_TIERS: RankTier[] = [
    {
        name: 'Tân binh (Newbie)',
        min: 0, max: 99,
        color: 'text-slate-400',
        bgGradient: 'from-slate-500 to-slate-400',
        textShadow: 'shadow-slate-500/50',
        iconEmoji: '🔰',   // huy hiệu mới bắt đầu
        glowColor: 'rgba(148,163,184,0.5)',
        badgeBg: 'bg-slate-700/60',
    },
    {
        name: 'Học viên (Pupil)',
        min: 100, max: 249,
        color: 'text-green-400',
        bgGradient: 'from-green-600 to-green-400',
        textShadow: 'shadow-green-500/50',
        iconEmoji: '🌿',   // mầm xanh
        glowColor: 'rgba(74,222,128,0.6)',
        badgeBg: 'bg-green-900/60',
    },
    {
        name: 'Chuyên gia (Expert)',
        min: 250, max: 449,
        color: 'text-blue-400',
        bgGradient: 'from-blue-600 to-blue-400',
        textShadow: 'shadow-blue-500/50',
        iconEmoji: '⚡',   // sức mạnh
        glowColor: 'rgba(96,165,250,0.7)',
        badgeBg: 'bg-blue-900/60',
    },
    {
        name: 'Bậc thầy (Master)',
        min: 450, max: 699,
        color: 'text-purple-400',
        bgGradient: 'from-purple-600 to-purple-400',
        textShadow: 'shadow-purple-500/50',
        iconEmoji: '💎',   // kim cương
        glowColor: 'rgba(192,132,252,0.7)',
        badgeBg: 'bg-purple-900/60',
    },
    {
        name: 'Đại sư (Grandmaster)',
        min: 700, max: 999,
        color: 'text-yellow-400',
        bgGradient: 'from-yellow-600 to-yellow-400',
        textShadow: 'shadow-yellow-500/50',
        iconEmoji: '👑',   // vương miện
        glowColor: 'rgba(250,204,21,0.8)',
        badgeBg: 'bg-yellow-900/60',
    },
    {
        name: 'Huyền thoại (Legendary)',
        min: 1000, max: 10000,
        color: 'text-red-400',
        bgGradient: 'from-red-600 to-red-400',
        textShadow: 'shadow-red-500/50',
        iconEmoji: '🔥',   // lửa huyền thoại
        glowColor: 'rgba(248,113,113,0.9)',
        badgeBg: 'bg-red-900/60',
    },
];

export const CONTEST_RANK_TIERS: RankTier[] = [...RANK_TIERS];

export const PRACTICE_RANK_TIERS: RankTier[] = [...RANK_TIERS];

export const TOTAL_RANK_TIERS: RankTier[] = [
    { ...RANK_TIERS[0], min: 0, max: 99 },
    { ...RANK_TIERS[1], min: 100, max: 299 },
    { ...RANK_TIERS[2], min: 300, max: 749 },
    { ...RANK_TIERS[3], min: 750, max: 1499 },
    { ...RANK_TIERS[4], min: 1500, max: 2499 },
    { ...RANK_TIERS[5], min: 2500, max: 20000 },
];

export const getRankByRating = (rating: number, type: RankType = 'contest'): RankTier => {
    const val = rating || 0;
    let tiers = CONTEST_RANK_TIERS;
    if (type === 'practice') tiers = PRACTICE_RANK_TIERS;
    if (type === 'total') tiers = TOTAL_RANK_TIERS;
    
    // Tìm tier cao nhất mà rating đạt tới (min <= val)
    // Sắp xếp ngược lại để tìm phần tử đầu tiên thỏa mãn
    const tier = [...tiers].reverse().find(t => val >= t.min);
    return tier || tiers[0];
};
