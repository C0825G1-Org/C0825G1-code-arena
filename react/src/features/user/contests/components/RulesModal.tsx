import React, { useState } from 'react';
import { X, WarningCircle, CheckCircle, Info } from '@phosphor-icons/react';

interface RulesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const [agreed, setAgreed] = useState(false);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-500/20 rounded-xl">
                            <WarningCircle weight="fill" className="text-yellow-500 text-2xl" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Quy định cuộc thi</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-white"
                    >
                        <X size={24} weight="bold" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 text-slate-300">
                    <section>
                        <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                            <Info weight="duotone" className="text-blue-400" /> 1. Nguyên tắc chung
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-sm leading-relaxed">
                            <li>Thí sinh phải tự mình hoàn thành bài thi, không được phép nhờ người khác làm hộ.</li>
                            <li>Nghiêm cấm mọi hành vi sao chép mã nguồn từ internet hoặc từ các thí sinh khác.</li>
                            <li>Hệ thống sẽ tự động quét và phát hiện các trường hợp Plagiarism (giống nhau mã nguồn).</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                            <Info weight="duotone" className="text-blue-400" /> 2. Chế độ giám sát
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-sm leading-relaxed">
                            <li>Hệ thống sẽ yêu cầu quyền truy cập <b>Camera</b> để ghi hình ngẫu nhiên trong suốt quá trình thi.</li>
                            <li>Nếu rời khỏi tab hoặc cửa sổ trình duyệt quá 3 lần, bài thi sẽ bị tự động nộp và khóa ngay lập tức.</li>
                            <li>Yêu cầu bật chế độ <b>Toàn màn hình (F11)</b> trong suốt thời gian làm bài.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                            <Info weight="duotone" className="text-blue-400" /> 3. Thời gian & Nộp bài
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-sm leading-relaxed">
                            <li>Điểm số tính dựa trên số test case vượt qua. Quy tắc ICPC áp dụng cho bảng xếp hạng.</li>
                            <li>Khi thời gian kết thúc, hệ thống sẽ tự động nộp bản lưu code mới nhất của bạn.</li>
                            <li>Nếu bạn chủ động <b>Thoát</b> cuộc thi, bạn sẽ không thể quay lại làm bài tiếp.</li>
                        </ul>
                    </section>

                    <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl flex gap-3 italic text-sm text-blue-300">
                        <Info size={20} weight="fill" className="shrink-0" />
                        <p>Bằng việc nhất "Bắt đầu thi", bạn cam kết tuân thủ mọi quy định trên để đảm bảo tính công bằng.</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-slate-700 bg-slate-900/30 flex flex-col gap-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                            <input
                                type="checkbox"
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                                className="peer appearance-none w-6 h-6 border-2 border-slate-600 rounded-md checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer"
                            />
                            <CheckCircle
                                weight="bold"
                                className={`absolute text-white text-base transition-opacity ${agreed ? 'opacity-100' : 'opacity-0'}`}
                            />
                        </div>
                        <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                            Tôi đã đọc kỹ và đồng ý tuân thủ các quy định nêu trên.
                        </span>
                    </label>

                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 px-6 rounded-xl font-bold bg-slate-700 hover:bg-slate-600 text-white transition-all outline-none"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            disabled={!agreed}
                            onClick={onConfirm}
                            className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all shadow-lg ${agreed
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/20'
                                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed shadow-none'
                                }`}
                        >
                            Bắt đầu thi ngay
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
