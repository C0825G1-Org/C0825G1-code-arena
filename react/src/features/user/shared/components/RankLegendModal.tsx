import React, { useState } from 'react';
import { CONTEST_RANK_TIERS, TOTAL_RANK_TIERS, RankTier } from '../utils/rankUtils';
import { X, Info } from '@phosphor-icons/react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    initialTab?: 'contest' | 'practice' | 'total';
}

const RankLegendModal: React.FC<Props> = ({ isOpen, onClose, initialTab = 'contest' }) => {
    const [activeTab, setActiveTab] = useState<'contest' | 'practice' | 'total'>(initialTab);

    if (!isOpen) return null;

    const tiers = (activeTab === 'contest' || activeTab === 'practice') ? CONTEST_RANK_TIERS : TOTAL_RANK_TIERS;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}></div>
            
            <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
                            <Info size={24} weight="duotone" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Hệ Thống Cấp Bậc</h2>
                            <p className="text-xs text-slate-400">Tra cứu ngưỡng điểm để đạt các thứ hạng</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-2 bg-slate-800/30 gap-1 border-b border-slate-700/30">
                    <button
                        onClick={() => setActiveTab('contest')}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            (activeTab === 'contest' || activeTab === 'practice') 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                            : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                        }`}
                    >
                        Cuộc thi & Luyện tập
                    </button>
                    <button
                        onClick={() => setActiveTab('total')}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            activeTab === 'total' 
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' 
                            : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                        }`}
                    >
                        Rating Tổng (Danh vọng)
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tiers.map((tier: RankTier, index) => (
                            <div 
                                key={index}
                                className="group relative p-4 rounded-2xl border border-slate-700/50 bg-slate-800/40 hover:bg-slate-800/60 transition-all"
                            >
                                {/* Background Glow */}
                                <div className={`absolute -right-2 -top-2 w-16 h-16 bg-gradient-to-br ${tier.bgGradient} opacity-0 blur-2xl group-hover:opacity-10 transition-opacity`}></div>
                                
                                <div className="flex items-center gap-4 relative">
                                    <div 
                                        className="w-12 h-12 rounded-xl bg-slate-900/80 flex items-center justify-center text-2xl border border-slate-700 group-hover:border-slate-500 transition-colors"
                                        style={{ filter: `drop-shadow(0 0 8px ${tier.glowColor}44)` }}
                                    >
                                        {tier.iconEmoji}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className={`text-base font-bold ${tier.color} tracking-wide`}>
                                            {tier.name.split(' (')[0]}
                                        </h3>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-xs font-mono font-bold text-slate-200">{tier.min}</span>
                                            <span className="text-slate-600 text-[10px]">—</span>
                                            <span className="text-xs font-mono font-bold text-slate-200">{tier.max > 10000 ? '∞' : tier.max}</span>
                                            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 uppercase tracking-tighter">points</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                        <p className="text-xs text-blue-400 leading-relaxed italic">
                            * Rating Tổng được tính bằng: (Rating Cuộc thi × 2) + Rating Luyện tập. 
                            Các ngưỡng điểm của Rating Tổng cao hơn để phản ánh sự nỗ lực bền bỉ trên cả hai mặt trận.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-800/50 border-t border-slate-700/50 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-bold transition-all"
                    >
                        Đã hiểu
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RankLegendModal;
