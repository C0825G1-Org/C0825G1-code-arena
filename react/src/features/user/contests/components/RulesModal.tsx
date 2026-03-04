import React, { useState } from 'react';
import { X, WarningCircle, CheckCircle, Info, Scales, Camera, Browser, Timer, Gavel } from '@phosphor-icons/react';

interface RulesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const [agreed, setAgreed] = useState(false);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#1e293b] border border-white/10 w-full max-w-3xl rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] relative">

                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[100px] pointer-events-none" />

                {/* Header */}
                <div className="px-10 py-8 border-b border-white/5 flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-2xl border border-blue-500/30">
                            <Gavel weight="fill" className="text-blue-400 text-3xl" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight">QUI ĐỊNH CUỘC THI</h2>
                            <p className="text-slate-400 text-sm font-medium">Vui lòng đọc kỹ trước khi bắt đầu</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-full transition-all text-slate-400 hover:text-white hover:rotate-90"
                    >
                        <X size={28} weight="bold" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-10 py-8 space-y-8 custom-scrollbar relative z-10">

                    {/* Part 1: Ethics */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3 text-blue-400">
                            <Scales size={24} weight="duotone" />
                            <h3 className="text-lg font-bold text-slate-100 uppercase tracking-wider">1. Đạo đức và Trung thực</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-900/40 rounded-2xl border border-white/5 space-y-2">
                                <p className="text-sm text-slate-300 leading-relaxed italic">
                                    "Thí sinh cam kết tự mình hoàn thành bài thi. Mọi hình thức hỗ trợ từ bên ngoài hoặc sử dụng AI để giải bài đều bị nghiêm cấm."
                                </p>
                            </div>
                            <ul className="space-y-3">
                                <li className="flex gap-3 text-sm text-slate-400">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                                    <span>Nghiêm cấm sao chép mã nguồn (Plagiarism). Hệ thống rà soát tự động với thuật toán so khớp cấp độ cao.</span>
                                </li>
                                <li className="flex gap-3 text-sm text-slate-400">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                                    <span>Mọi tài khoản vi phạm sẽ bị khóa vĩnh viễn và hủy bỏ toàn bộ kết quả trước đó.</span>
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* Part 2: Security */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3 text-red-400">
                            <Camera size={24} weight="duotone" />
                            <h3 className="text-lg font-bold text-slate-100 uppercase tracking-wider">2. Giám sát chống gian lận</h3>
                        </div>
                        <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6 space-y-4">
                            <div className="flex items-start gap-4">
                                <Browser size={32} weight="fill" className="text-red-500 shrink-0" />
                                <div>
                                    <p className="text-white font-bold mb-1">Chặn chuyển đổi Tab/Ứng dụng</p>
                                    <p className="text-slate-400 text-sm">Hệ thống ghi lại số lần bạn rời khỏi trình duyệt. Vi phạm <b>quá 3 lần</b> sẽ dẫn đến truất quyền thi ngay lập tức.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <Camera size={32} weight="fill" className="text-red-500 shrink-0" />
                                <div>
                                    <p className="text-white font-bold mb-1">Giám sát Video (Random Snapshot)</p>
                                    <p className="text-slate-400 text-sm">Yêu cầu bật Camera. Hệ thống sẽ chụp ảnh ngẫu nhiên để xác minh danh tính và sự hiện diện của bạn.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-red-400/80 bg-red-400/10 w-fit px-3 py-1 rounded-full border border-red-400/20">
                                <WarningCircle weight="fill" />
                                KHUYẾN KHÍCH: Nhấn F11 để sử dụng chế độ Toàn màn hình giúp hạn chế lỗi chuyển tab.
                            </div>
                        </div>
                    </section>

                    {/* Part 3: Scoring */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3 text-emerald-400">
                            <Timer size={24} weight="duotone" />
                            <h3 className="text-lg font-bold text-slate-100 uppercase tracking-wider">3. Cách tính điểm và Nộp bài</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-5 bg-slate-900/40 rounded-2xl border border-white/5 border-l-4 border-l-emerald-500">
                                <h4 className="text-emerald-400 font-bold text-sm mb-2">Quy tắc ICPC</h4>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Xếp hạng dựa trên số bài AC. Nếu bằng số bài, thí sinh có tổng <b>Time Penalty</b> thấp hơn sẽ xếp trên. Mỗi lần nộp sai (không phải CE) cộng thêm 20 phút penalty nếu bài đó sau đó được AC.
                                </p>
                            </div>
                            <ul className="space-y-3">
                                <li className="flex gap-3 text-sm text-slate-400">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                                    <span><b>Chấm điểm tự động:</b> Sử dụng bộ Test ẩn. Chỉ những lượt nộp hoàn thành chính xác toàn bộ test case mới được tính điểm.</span>
                                </li>
                                <li className="flex gap-3 text-sm text-slate-400">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                                    <span><b>Tự động nộp bài:</b> Khi hết giờ, hệ thống sẽ tự nộp phiên bản code cuối cùng của bạn tại editor cho các câu chưa nộp chính thức.</span>
                                </li>
                            </ul>
                        </div>
                    </section>

                    <div className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-2xl flex gap-4 text-sm text-blue-300 shadow-inner">
                        <Info size={24} weight="fill" className="shrink-0 text-blue-400" />
                        <div className="space-y-1">
                            <p className="font-bold text-white uppercase tracking-tighter">Cam kết từ thí sinh</p>
                            <p className="leading-relaxed opacity-80">Bằng việc tham gia cuộc thi, tôi tự nguyện chấp nhận mọi kết luận của ban giám khảo dựa trên các dữ liệu vi phạm được hệ thống ghi nhận.</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-10 py-8 border-t border-white/5 bg-slate-900/50 relative z-10">
                    <div className="flex flex-col gap-6">
                        <label className="flex items-center gap-4 cursor-pointer group select-none">
                            <div className="relative flex items-center justify-center">
                                <input
                                    type="checkbox"
                                    checked={agreed}
                                    onChange={(e) => setAgreed(e.target.checked)}
                                    className="peer appearance-none w-8 h-8 md:w-6 md:h-6 border-2 border-slate-600 rounded-lg checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer box-content p-0.5"
                                />
                                <CheckCircle
                                    weight="bold"
                                    className={`absolute text-white text-xl md:text-base transition-all scale-0 ${agreed ? 'scale-100 opacity-100' : 'opacity-0'}`}
                                />
                            </div>
                            <span className="text-sm md:text-base font-bold text-slate-400 group-hover:text-blue-400 transition-colors">
                                Tôi xác nhận đã hiểu rõ các quy định và sẵn sàng tham gia cuộc thi.
                            </span>
                        </label>

                        <div className="flex gap-4">
                            <button
                                onClick={onClose}
                                className="flex-1 py-4 px-6 rounded-2xl font-black bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-white/5"
                            >
                                QUAY LẠI
                            </button>
                            <button
                                disabled={!agreed}
                                onClick={onConfirm}
                                className={`flex-[2] py-4 px-6 rounded-2xl font-black transition-all shadow-[0_10px_30px_rgba(0,0,0,0.3)] flex items-center justify-center gap-2 ${agreed
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25 active:scale-95'
                                    : 'bg-slate-900 text-slate-600 border border-white/5 cursor-not-allowed'
                                    }`}
                            >
                                BẮT ĐẦU THI <ArrowRight weight="bold" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Re-using ArrowRight for the button
const ArrowRight = ({ weight, className }: { weight: string, className?: string }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
        <path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L204.69,128,138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"></path>
    </svg>
);
