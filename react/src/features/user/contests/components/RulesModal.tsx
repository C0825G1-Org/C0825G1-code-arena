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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-5 bg-slate-900/40 rounded-2xl border border-white/5 space-y-3">
                                <p className="text-sm text-slate-300 leading-relaxed font-medium">
                                    Thí sinh phải tự mình hoàn thành bài thi mà không có bất kỳ sự trợ giúp nào từ người khác hoặc các công cụ hỗ trợ không được phép.
                                </p>
                            </div>
                            <ul className="space-y-3">
                                <li className="flex gap-3 text-sm text-slate-400">
                                    <CheckCircle size={18} className="text-blue-500 shrink-0 mt-0.5" />
                                    <span><b>Cấm Plagiarism:</b> Nghiêm cấm sao chép mã nguồn từ internet hoặc từ thí sinh khác. Hệ thống sử dụng MOSS (Measure Of Software Similarity) để phát hiện gian lận.</span>
                                </li>
                                <li className="flex gap-3 text-sm text-slate-400">
                                    <CheckCircle size={18} className="text-blue-500 shrink-0 mt-0.5" />
                                    <span><b>Cấm AI/Bot:</b> Không sử dụng ChatGPT, GitHub Copilot hoặc bất kỳ công cụ AI sinh mã nào trong suốt quá trình thi.</span>
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* Part 2: Security */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3 text-red-400">
                            <Camera size={24} weight="duotone" />
                            <h3 className="text-lg font-bold text-slate-100 uppercase tracking-wider">2. Giám sát kỹ thuật</h3>
                        </div>
                        <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-start gap-4">
                                    <Browser size={32} weight="fill" className="text-red-500 shrink-0" />
                                    <div>
                                        <p className="text-white font-bold mb-1">Chặn chuyển đổi Tab</p>
                                        <p className="text-slate-400 text-xs leading-relaxed">Hệ thống ghi nhận mỗi lần bạn chuyển Tab hoặc ứng dụng. <b>Vi phạm 3 lần</b> sẽ bị truất quyền thi tự động.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <Camera size={32} weight="fill" className="text-red-500 shrink-0" />
                                    <div>
                                        <p className="text-white font-bold mb-1">Xác minh Camera</p>
                                        <p className="text-slate-400 text-xs leading-relaxed">Snapshot ngẫu nhiên được thực hiện để đối soát gương mặt. Vui lòng không che mặt hoặc rời khỏi khung hình quá lâu.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 flex items-center gap-3 text-xs text-red-300">
                                <WarningCircle size={20} weight="fill" className="animate-pulse shrink-0" />
                                <span><b>MẸO:</b> Nhấn <b>F11</b> ngay sau khi bắt đầu để vào chế độ Toàn màn hình, giúp tránh các lỗi vô tình nhảy Tab do thông báo hệ thống.</span>
                            </div>
                        </div>
                    </section>

                    {/* Part 3: Scoring & Limits */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3 text-emerald-400">
                            <Timer size={24} weight="duotone" />
                            <h3 className="text-lg font-bold text-slate-100 uppercase tracking-wider">3. Quy tắc chấm điểm &amp; Giới hạn</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/20">
                                    <h4 className="text-emerald-400 font-bold text-sm mb-2 flex items-center gap-2">
                                        <Scales weight="bold" /> Hệ thống chấm điểm
                                    </h4>
                                    <ul className="text-xs text-slate-400 space-y-2">
                                        <li>• Mỗi test case có <b>trọng số (scoreWeight)</b>. Điểm mỗi bài = tổng scoreWeight các test <b>pass</b>.</li>
                                        <li>• Điểm cuộc thi = tổng điểm tất cả bài. AC toàn bộ = điểm tối đa.</li>
                                        <li>• Xếp hạng theo: <b>Tổng điểm cao hơn</b> → <b>Số bài AC nhiều hơn</b> → <b>Thời gian tích lũy ít hơn</b>.</li>
                                        <li>• Thời gian tích lũy: thời gian đến khi AC + <b>20 phút/lần nộp sai</b> (chỉ tính bài đã AC).</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="p-5 bg-blue-500/5 rounded-2xl border border-blue-500/20">
                                    <h4 className="text-blue-400 font-bold text-sm mb-2 flex items-center gap-2">
                                        <Info weight="bold" /> Giới hạn &amp; Màu sắc giao diện
                                    </h4>
                                    <ul className="text-xs text-slate-400 space-y-2">
                                        <li>• Tối đa <b>50 lần nộp/bài</b>. Kiểm tra kỹ Test mẫu trước khi nộp chính thức.</li>
                                        <li>• Mã nguồn chạy trong Docker sandbox, đảm bảo công bằng tuyệt đối.</li>
                                        <li className="flex items-center gap-2">
                                            <span className="inline-block w-4 h-4 rounded bg-emerald-600/30 border border-emerald-600/40 shrink-0" />
                                            <span>Nút bài <b className="text-emerald-400">xanh</b> = đã AC (pass all tests)</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="inline-block w-4 h-4 rounded bg-orange-600/30 border border-orange-600/40 shrink-0" />
                                            <span>Nút bài <b className="text-orange-400">cam</b> = đã nộp nhưng chưa AC</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Part 4: Technical Environment */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3 text-purple-400">
                            <Info size={24} weight="duotone" />
                            <h3 className="text-lg font-bold text-slate-100 uppercase tracking-wider">4. Môi trường & Sự cố</h3>
                        </div>
                        <div className="p-5 bg-slate-900/60 rounded-2xl border border-white/5 text-sm text-slate-400 space-y-3">
                            <p>• Đảm bảo kết nối Internet ổn định. Không nên F5/Refresh trang trừ khi gặp lỗi hiển thị nghiêm trọng.</p>
                            <p>• Nếu gặp lỗi "System Error" hoặc "Judging Hanging" quá lâu (trên 30s), hãy liên hệ giám thị qua kênh hỗ trợ trực tuyến ngay lập tức.</p>
                            <p>• Hệ thống hỗ trợ tốt nhất trên <b>Chrome / Microsoft Edge</b> phiên bản mới nhất.</p>
                        </div>
                    </section>

                    <div className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-2xl flex gap-4 text-sm text-blue-300 shadow-inner">
                        <Info size={24} weight="fill" className="shrink-0 text-blue-400" />
                        <div className="space-y-1">
                            <p className="font-bold text-white uppercase tracking-tighter">Xác nhận của thí sinh</p>
                            <p className="leading-relaxed opacity-80 text-xs">Bằng việc nhấn "Bắt đầu thi", tôi cam kết tuân thủ mọi quy định trên và chấp nhận kết quả đánh giá cuối cùng từ Ban giám khảo và Hệ thống CodeArena.</p>
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
