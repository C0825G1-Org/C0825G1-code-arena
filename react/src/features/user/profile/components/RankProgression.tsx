import React from 'react';
import { RANK_TIERS } from '../../shared/utils/rankUtils';

interface Props {
    rating: number;
}

const RankProgression: React.FC<Props> = ({ rating }) => {
    const currentTierIndex = RANK_TIERS.findIndex(tier => rating >= tier.min && rating <= tier.max);
    const tier = RANK_TIERS[currentTierIndex] || RANK_TIERS[0];
    const nextTier = RANK_TIERS[currentTierIndex + 1];

    const range = tier.max - tier.min;
    const progress = !nextTier ? 100 : (range > 0 ? ((rating - tier.min) / range) * 100 : 100);

    return (
        <div className="w-full glass p-5 rounded-2xl border border-slate-700/50 bg-slate-800/40 relative group overflow-hidden transition-all hover:bg-slate-800/60">
            {/* Background Glow */}
            <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${tier.bgGradient} opacity-5 blur-3xl group-hover:opacity-10 transition-opacity`}></div>

            <div className="flex items-center gap-3 mb-6 relative">
                <div
                    className={`p-2 rounded-xl bg-slate-900/50 border border-slate-700/80`}
                    style={{ filter: `drop-shadow(0 0 8px ${tier.glowColor})` }}
                >
                    <span style={{ fontSize: '20px', lineHeight: 1 }}>{tier.iconEmoji}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Xếp Hạng Đấu Trường</h3>
            </div>

            <div className="flex flex-col items-center text-center space-y-2 mb-6">
                <div className="relative">
                    <span className="text-4xl font-black text-white tracking-tighter drop-shadow-lg">
                        {rating}
                    </span>
                    <div className={`absolute -inset-1 blur-lg opacity-20 ${tier.bgGradient}`}></div>
                </div>
                <span className={`text-sm font-bold tracking-wide uppercase ${tier.color} drop-shadow-sm`}>
                    {tier.name}
                </span>
            </div>

            <div className="space-y-3 relative">
                {/* Progress Bar Container */}
                <div className="relative h-2.5 w-full bg-slate-900/80 rounded-full border border-slate-700/30 overflow-hidden shadow-inner">
                    <div
                        className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${tier.bgGradient}`}
                        style={{ width: `${Math.min(100, progress)}%` }}
                    >
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                </div>

                {/* Range Labels */}
                <div className="flex justify-between items-center text-[10px] font-mono font-bold tracking-tighter uppercase">
                    <div className="flex flex-col items-start translate-y-1">
                        <span className="text-slate-500">{tier.min}</span>
                    </div>

                    {nextTier && (
                        <div className="flex flex-col items-end translate-y-1">
                            <span className="text-slate-500">{tier.max + 1} ({nextTier.name.split(' (')[0]})</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RankProgression;
