import React from 'react';
import { X, Info, Trophy, Target, Calculator, TrendUp } from '@phosphor-icons/react';

interface EloExplainingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const EloExplainingModal: React.FC<EloExplainingModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-slate-900 border border-slate-700/50 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400 border border-blue-500/30">
                            <Info size={24} weight="fill" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white leading-none">Cơ chế tính điểm Elo</h3>
                            <p className="text-slate-400 text-sm mt-1">Cách CodeArena vinh danh tài năng của bạn</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-all flex items-center justify-center"
                    >
                        <X size={24} weight="bold" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                    <div className="space-y-8">
                        {/* Summary */}
                        <section>
                            <div className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl">
                                <p className="text-blue-200 text-sm leading-relaxed italic">
                                    "Hệ thống Elo không chỉ cộng điểm khi bạn thắng, mà nó tính toán dựa trên <strong>nỗ lực</strong> và <strong>đối thủ</strong> mà bạn đã vượt qua."
                                </p>
                            </div>
                        </section>

                        {/* Practice Elo */}
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-emerald-600/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                                    <Target size={18} weight="fill" />
                                </div>
                                <h4 className="text-lg font-bold text-emerald-400">1. Elo Luyện tập (Practice)</h4>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/30">
                                    <p className="text-slate-300 text-sm mb-3">Phụ thuộc vào <strong>độ khó bài tập</strong>:</p>
                                    <ul className="space-y-2 text-xs text-slate-400">
                                        <li className="flex justify-between"><span>Dễ (Easy)</span> <span className="text-blue-400">800 pts</span></li>
                                        <li className="flex justify-between"><span>Trung bình (Medium)</span> <span className="text-yellow-400">1200 pts</span></li>
                                        <li className="flex justify-between"><span>Khó (Hard)</span> <span className="text-red-400">1800 pts</span></li>
                                    </ul>
                                </div>
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/30">
                                    <p className="text-slate-300 text-sm font-bold mb-1">Ví dụ:</p>
                                    <p className="text-slate-400 text-xs leading-relaxed">
                                        Nếu bạn có 500 Elo, giải bài <strong>Khó</strong> sẽ được cộng khoảng <span className="text-emerald-400">+15</span>.
                                        Nhưng nếu bạn đã 2000 Elo, giải bài <strong>Dễ</strong> chỉ cộng <span className="text-emerald-400">+1</span>.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Contest Elo */}
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                                    <Trophy size={18} weight="fill" />
                                </div>
                                <h4 className="text-lg font-bold text-indigo-400">2. Elo Cuộc thi (Contest)</h4>
                            </div>
                            <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/30 space-y-4">
                                <p className="text-slate-300 text-sm leading-relaxed">
                                    Đây là kết quả của việc đấu cặp ảo với <strong>tất cả người tham gia</strong> trong cuộc thi:
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800 translate-x-1">
                                        <div className="flex items-center gap-2 text-emerald-400 mb-1">
                                            <TrendUp size={16} /> <span className="text-xs font-bold uppercase">Cộng điểm đậm</span>
                                        </div>
                                        <p className="text-slate-400 text-[11px]">Khi bạn thắng những đối thủ có Rating cao hơn mình.</p>
                                    </div>
                                    <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800 -translate-x-1">
                                        <div className="flex items-center gap-2 text-red-400 mb-1">
                                            <TrendUp size={16} className="rotate-180" /> <span className="text-xs font-bold uppercase">Trừ điểm nặng</span>
                                        </div>
                                        <p className="text-slate-400 text-[11px]">Khi bạn thua những đối thủ có Rating thấp hơn mình.</p>
                                    </div>
                                </div>
                                <p className="text-slate-500 text-[11px] italic text-center">
                                    *Hệ thống sử dụng cơ chế Zero-sum: Tổng điểm cộng/trừ trong phòng thi bằng 0 để tránh lạm phát.
                                </p>
                            </div>
                        </section>

                        {/* Total Elo */}
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center text-violet-400 border border-violet-500/30">
                                    <Calculator size={18} weight="fill" />
                                </div>
                                <h4 className="text-lg font-bold text-violet-400">3. Elo Tổng (Total)</h4>
                            </div>
                            <div className="relative p-6 bg-gradient-to-r from-violet-600/20 to-purple-600/20 rounded-2xl border border-violet-500/30 overflow-hidden flex flex-col items-center justify-center">
                                <p className="text-slate-300 text-sm mb-4">Cách tính bảng vàng chính:</p>
                                <div className="text-2xl md:text-3xl font-black text-white tracking-tighter flex items-center gap-3">
                                    <span className="bg-slate-900/50 px-3 py-1.5 rounded-xl border border-slate-700">(Elo Cuộc thi × 2)</span>
                                    <span className="text-violet-500">+</span>
                                    <span className="bg-slate-900/50 px-3 py-1.5 rounded-xl border border-slate-700">Elo Luyện tập</span>
                                </div>
                                <p className="text-slate-400 text-[11px] mt-4 max-w-md text-center">
                                    CodeArena nhân đôi trọng số cuộc thi vì việc giải thuật dưới áp lực thời gian và đối mặt với đối thủ thực tế xứng đáng được vinh danh cao hơn.
                                </p>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 bg-slate-800/30 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20"
                    >
                        Đã hiểu
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EloExplainingModal;
