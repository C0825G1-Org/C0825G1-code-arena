import React from 'react';

/**
 * Các Toast Content được tách ra để useAntiCheat.tsx tuân thủ SOLID (SRP)
 */

export const ViolationToastContent = ({ count, message }: { count: number; message: string }) => (
    <div className="flex flex-col gap-1">
        <span className="font-bold text-base">
            {count === 1 && "⚠️ CẢNH BÁO VI PHẠM (1/3)"}
            {count === 2 && "🔴 VI PHẠM LẦN 2 – ĐIỂM BỊ CHIA ĐÔI!"}
            {count >= 3 && "🚫 VI PHẠM LẦN 3 – BỊ TRUẤT QUYỀN THI!"}
        </span>
        <span className="text-sm">{message}</span>
        {count === 1 && <span className="text-xs opacity-80">Lần 2: Điểm bị chia đôi. Lần 3: Bị truất quyền thi.</span>}
        {count === 2 && <span className="text-xs opacity-80">⚠️ Rời màn hình thêm 1 lần nữa sẽ bị truất quyền thi!</span>}
        {count >= 3 && <span className="text-xs opacity-80">Bài thi đã bị khóa. Bấm nút Thoát để rời khỏi phòng thi.</span>}
    </div>
);

export const InitViolationToastContent = ({ count }: { count: number }) => (
    <div className="flex flex-col gap-1">
        <span className="font-bold">
            {count === 1 ? "⚠️ Bạn đã có 1 lần vi phạm" : "🔴 Bạn đã có 2 lần vi phạm – Điểm đang bị chia đôi!"}
        </span>
        <span className="text-sm">
            {count === 1 ? "Lần 2: Điểm bị chia đôi. Lần 3: Bị truất quyền thi." : "⚠️ Thêm 1 lần vi phạm nữa sẽ bị truất quyền thi!"}
        </span>
    </div>
);

export const DisqualifiedToastContent = () => (
    <div className="flex flex-col gap-1">
        <span className="font-bold text-base">⛔ BẠN ĐÃ BỊ TRUẤT QUYỀN THI</span>
        <span className="text-sm">Bài thi đã bị khóa do vi phạm 3 lần.</span>
    </div>
);

export const FullscreenWarningToastContent = ({ timeLeft, onEnterFullscreen }: { timeLeft: number; onEnterFullscreen: () => void }) => (
    <div className="flex flex-col gap-2">
        <span className="font-bold text-red-600 flex items-center gap-1">⚠️ CẢNH BÁO TOÀN MÀN HÌNH</span>
        <span className="text-xs text-slate-700 leading-relaxed">
            Hệ thống phát hiện bạn đã thoát chế độ Toàn màn hình.<br />
            Vui lòng quay lại nếu không muốn bị đánh dấu gian lận!
        </span>
        <span className="text-sm font-bold text-red-500 mt-1">Sẽ tính 1 vi phạm sau: {timeLeft}s</span>
        <button
            onClick={onEnterFullscreen}
            className="bg-red-600 px-3 py-2 rounded text-white text-xs font-bold hover:bg-red-700 transition-colors mt-1"
        >
            Ghim Toàn màn hình (F11) ngay
        </button>
    </div>
);
