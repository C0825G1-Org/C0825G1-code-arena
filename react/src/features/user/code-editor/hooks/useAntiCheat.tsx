import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { contestService } from '../../home/services/contestService';

interface UseAntiCheatProps {
    isExamMode: boolean;
    contestId?: string;
    onDisqualified: () => void;
}

export const useAntiCheat = ({ isExamMode, contestId, onDisqualified }: UseAntiCheatProps) => {
    const [violationCount, setViolationCount] = useState(0);
    const [scorePenalty, setScorePenalty] = useState(false);
    const violationRef = useRef(0);
    const onDisqualifiedRef = useRef(onDisqualified);

    useEffect(() => {
        onDisqualifiedRef.current = onDisqualified;
    }, [onDisqualified]);

    const initViolations = (count: number, hasPenalty: boolean) => {
        setViolationCount(count);
        violationRef.current = count;
        setScorePenalty(hasPenalty);
    };

    const violationHandlerRef = useRef<(() => Promise<void>) | undefined>(undefined);
    violationHandlerRef.current = async () => {
        if (!document.hidden) return;
        if (!contestId) return;

        try {
            const result = await contestService.reportViolation(parseInt(contestId));
            const count = result.violationCount;

            violationRef.current = count;
            setViolationCount(count);

            if (count === 1) {
                toast.error(
                    <div className="flex flex-col gap-1" >
                <span className="font-bold text-base" >⚠️ CẢNH BÁO VI PHẠM(1 / 3) </span>
                < span className = "text-sm" > Bạn vừa rời khỏi màn hình thi! </span>
                < span className = "text-xs opacity-80" > Lần 2: Điểm bị chia đôi.Lần 3: Bị truất quyền thi.</span>
                </div>,
                    { autoClose: 8000, position: 'top-center', style: { fontWeight: 'bold', border: '2px solid #f97316' } }
                );
            } else if (count === 2) {
                setScorePenalty(true);
                toast.error(
                    <div className="flex flex-col gap-1" >
                <span className="font-bold text-base" >🔴 VI PHẠM LẦN 2 – ĐIỂM BỊ CHIA ĐÔI! </span>
                < span className = "text-sm" > Tất cả bài nộp từ bây giờ chỉ được tính 50 % điểm.</span>
                < span className = "text-xs opacity-80" >⚠️ Rời màn hình thêm 1 lần nữa sẽ bị truất quyền thi! </span>
                </div>,
                    { toastId: 'violation-toast', autoClose: false, closeButton: true, position: 'top-center', style: { fontWeight: 'bold', border: '2px solid #ef4444' } }
                );
            } else if (count >= 3) {
                if (onDisqualifiedRef.current) {
                    onDisqualifiedRef.current();
                }
            }
        } catch (err) {
            console.error("Lỗi khi báo cáo vi phạm:", err);
        }
    };

    // Bắt sự kiện chuyển tab
    useEffect(() => {
        if (!isExamMode) return;
        const handler = () => violationHandlerRef.current?.();
        document.addEventListener('visibilitychange', handler);
        return () => document.removeEventListener('visibilitychange', handler);
    }, [isExamMode]);

    // Anti-cheat: Fullscreen và Context menu
    useEffect(() => {
        if (!isExamMode) return;

        const toastId = "fullscreen-prompt";

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        };

        const checkFullscreen = () => {
            if (!document.fullscreenElement && !(document as any).webkitFullscreenElement && !(document as any).msFullscreenElement) {
                if (!toast.isActive(toastId)) {
                    toast.info(
                        <div className="flex flex-col gap-2" >
                    <span className="font-bold" >⚠️ Yêu cầu Toàn màn hình </span>
                    < span className = "text-xs" > Vui lòng bật chế độ Toàn màn hình để tiếp tục làm bài thi! </span>
                    < button
                                onClick = {() => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) elem.requestFullscreen();
    else if ((elem as any).webkitRequestFullscreen) (elem as any).webkitRequestFullscreen();
    else if ((elem as any).msRequestFullscreen) (elem as any).msRequestFullscreen();
    toast.dismiss(toastId);
}}
className = "bg-blue-600 px-3 py-1.5 rounded text-white text-xs font-bold hover:bg-blue-700 transition-colors"
    >
    Bật Toàn màn hình(F11)
        </button>
        </div>,
{
    toastId,
        autoClose: false,
            closeOnClick: false,
                closeButton: false,
                    position: "top-center",
                        style: { border: '1px solid #3b82f6' }
}
                    );
                }
            } else {
    toast.dismiss(toastId);
}
        };

const timer = setTimeout(checkFullscreen, 1000);

document.addEventListener('contextmenu', handleContextMenu);
['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(event => {
    document.addEventListener(event, checkFullscreen);
});

return () => {
    clearTimeout(timer);
    document.removeEventListener('contextmenu', handleContextMenu);
    ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(event => {
        document.removeEventListener(event, checkFullscreen);
    });
    toast.dismiss(toastId);
};
    }, [isExamMode]);

return {
    violationCount,
    scorePenalty,
    initViolations,
    triggerViolation: () => violationHandlerRef.current?.()
};
};
