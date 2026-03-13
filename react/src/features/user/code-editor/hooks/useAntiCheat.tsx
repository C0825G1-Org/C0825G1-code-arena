import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { contestService } from '../../home/services/contestService';
import {
    ViolationToastContent,
    InitViolationToastContent,
    DisqualifiedToastContent
} from '../components/AntiCheatToasts';
import { FullscreenWarningOverlay } from '../components/FullscreenWarningOverlay';

interface UseAntiCheatProps {
    isExamMode: boolean;
    contestId?: string;
    onDisqualified: () => void;
}

export const useAntiCheat = ({ isExamMode, contestId, onDisqualified }: UseAntiCheatProps) => {
    const [violationCount, setViolationCount] = useState(0);
    const [scorePenalty, setScorePenalty] = useState(false);
    
    // State cho Fullscreen Warning Overlay
    const [fullscreenWarningTimeLeft, setFullscreenWarningTimeLeft] = useState<number | null>(null);

    const violationRef = useRef(0);
    const onDisqualifiedRef = useRef(onDisqualified);
    const isReportingRef = useRef(false);

    useEffect(() => {
        onDisqualifiedRef.current = onDisqualified;
    }, [onDisqualified]);

    const initViolations = (count: number, hasPenalty: boolean, status: string = 'JOINED', silent: boolean = false) => {
        setViolationCount(count);
        violationRef.current = count;
        setScorePenalty(hasPenalty);

        if (silent) return;

        if (status === 'JOINED') {
            if (count === 1 || count === 2) {
                toast.warning(
                    <InitViolationToastContent count={count} />,
                    {
                        toastId: count === 1 ? 'violation-init' : 'violation-toast',
                        autoClose: count === 1 ? 8000 : false,
                        position: 'top-center',
                        closeButton: count === 2,
                        style: count === 2 ? { border: '2px solid #ef4444' } : undefined
                    }
                );
            }
        } else if (status === 'DISQUALIFIED' && count >= 3) {
            toast.error(
                <DisqualifiedToastContent />,
                { toastId: 'violation-disqualified', autoClose: false, closeButton: true, position: 'top-center', style: { fontWeight: 'bold', border: '2px solid #dc2626' } }
            );
        }
    };

    const violationHandlerRef = useRef<((bypassHiddenCheck?: boolean, force?: boolean) => Promise<void>) | undefined>(undefined);
    violationHandlerRef.current = async (bypassHiddenCheck = false, force = false) => {
        // Chỉ chấp nhận nếu: tab đang ẩn/mất focus (chuyển tab/HĐH) HOAC bypass (vi phạm Fullscreen / Camera)
        if (!force && !bypassHiddenCheck && !document.hidden && document.hasFocus()) return;
        if (!contestId) return;
        if (isReportingRef.current) return;

        try {
            isReportingRef.current = true;
            const result = await contestService.reportViolation(parseInt(contestId), force);
            
            // Lỗi backend: Backend báo thành công nhưng không tăng được violationCount
            // => Tự động tính + 1 local (fallback)
            let count = result.violationCount;
            if (!force && count <= violationRef.current) {
                count = violationRef.current + 1;
            }

            violationRef.current = count;
            setViolationCount(count);

            if (force) {
                toast.dismiss('violation-toast');
                toast.error(
                    <ViolationToastContent count={3} message="Bạn đã bị loại do từ chối cung cấp quyền Camera!" />,
                    { autoClose: false, closeButton: true, position: 'top-center', style: { fontWeight: 'bold', border: '3px solid #dc2626' } }
                );
                if (onDisqualifiedRef.current) {
                    onDisqualifiedRef.current();
                }
                return;
            }

            if (count === 1) {
                toast.error(
                    <ViolationToastContent count={1} message="Bạn vừa rời khỏi màn hình thi!" />,
                    { autoClose: 8000, position: 'top-center', style: { fontWeight: 'bold', border: '2px solid #f97316' } }
                );
            } else if (count === 2) {
                setScorePenalty(true);
                toast.error(
                    <ViolationToastContent count={2} message="Tất cả bài nộp từ bây giờ chỉ được tính 50% điểm." />,
                    { toastId: 'violation-toast', autoClose: false, closeButton: true, position: 'top-center', style: { fontWeight: 'bold', border: '2px solid #ef4444' } }
                );
            } else if (count >= 3) {
                toast.dismiss('violation-toast');
                toast.error(
                    <ViolationToastContent count={3} message="Bài thi đã bị khóa. Bạn chuyển sang chế độ chỉ xem." />,
                    { autoClose: false, closeButton: true, position: 'top-center', style: { fontWeight: 'bold', border: '2px solid #dc2626' } }
                );
                if (onDisqualifiedRef.current) {
                    onDisqualifiedRef.current();
                }
            }
        } catch (err) {
            console.error("Lỗi khi báo cáo vi phạm:", err);
        } finally {
            setTimeout(() => {
                isReportingRef.current = false;
            }, 1000);
        }
    };

    // Bắt sự kiện chuyển tab và mất focus (window.onblur)
    useEffect(() => {
        if (!isExamMode) return;
        
        let blurTimeout: NodeJS.Timeout;
        const handler = () => {
             // Đợi một xíu xem có thực sự mất focus không (tránh false positive khi click vào alert)
             clearTimeout(blurTimeout);
             blurTimeout = setTimeout(() => {
                 violationHandlerRef.current?.();
             }, 300);
        };
        
        document.addEventListener('visibilitychange', handler);
        window.addEventListener('blur', handler);
        
        return () => {
            clearTimeout(blurTimeout);
            document.removeEventListener('visibilitychange', handler);
            window.removeEventListener('blur', handler);
        };
    }, [isExamMode]);

    // Anti-cheat: Fullscreen và Context menu
    useEffect(() => {
        console.log("[AntiCheat] Status changed:", { isExamMode, contestId });
        if (!isExamMode) {
            console.log("[AntiCheat] Disabled for this session.");
            return;
        }
        console.log("[AntiCheat] Enabled. Monitoring Fullscreen and Tab switching...");

        const toastId = "fullscreen-prompt";
        let countdownTimer: ReturnType<typeof setInterval> | null = null;
        let timeLeft = 10;

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            toast.warning("Chuột phải bị vô hiệu hóa trong chế độ thi!", { toastId: 'block-contextmenu', autoClose: 2000 });
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            // Chặn F12
            if (e.key === 'F12') {
                e.preventDefault();
                toast.warning("F12 bị vô hiệu hóa trong chế độ thi!", { toastId: 'block-f12', autoClose: 2000 });
            }
            // Khắc phục F11 bàn phím cứng
            if (e.key === 'F11') {
                e.preventDefault();
                enterFullscreen();
                toast.info("Đã chuyển sang chế độ Toàn Màn Hình!", { toastId: 'f11-info', autoClose: 2000 });
            }
            // Chặn Alt + Tab 
            if (e.altKey && (e.key === 'Tab' || e.keyCode === 9)) {
                e.preventDefault();
                toast.warning("Alt + Tab bị vô hiệu hóa trong chế độ thi!", { toastId: 'block-alttab', autoClose: 2000 });
            }
            // Chặn DevTools shortcuts (Ctrl+Shift+I/J/C)
            if (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) {
                e.preventDefault();
                toast.warning("DevTools bị vô hiệu hóa!", { toastId: 'block-devtools', autoClose: 2000 });
            }
            // Chặn Ctrl+U (Xem mã nguồn)
            if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
                e.preventDefault();
                toast.warning("Xem mã nguồn bị vô hiệu hóa!", { toastId: 'block-source', autoClose: 2000 });
            }
        };

        const enterFullscreen = () => {
            const elem = document.documentElement;
            if (elem.requestFullscreen) elem.requestFullscreen();
            else if ((elem as any).webkitRequestFullscreen) (elem as any).webkitRequestFullscreen();
            else if ((elem as any).msRequestFullscreen) (elem as any).msRequestFullscreen();
        };

        const checkFullscreen = () => {
            if (!document.fullscreenElement && !(document as any).webkitFullscreenElement && !(document as any).msFullscreenElement) {
                // Đang ở chế độ cửa sổ
                if ('keyboard' in navigator && (navigator as any).keyboard && (navigator as any).keyboard.unlock) {
                    (navigator as any).keyboard.unlock();
                }

                if (!countdownTimer) {
                    const durationMs = 10000;
                    let targetTime = Date.now() + durationMs;

                    setFullscreenWarningTimeLeft(10);

                    countdownTimer = setInterval(() => {
                        // NẾU THÍ SINH ĐANG MỞ CẢNH BÁO F11 MÀ LẠI ALT+TAB HOẶC THU NHỎ WEB ĐỂ XEM TÀI LIỆU KHÁC (DOCUMENT.HIDDEN TRỞ THÀNH TRUE)
                        // => KÍCH HOẠT LỖI CHUYỂN TAB VI PHẠM NGAY LẬP TỨC! Không do dự (Thay vì chỉ hãm thời gian đếm như trước)
                        if (document.hidden || !document.hasFocus()) {
                             violationHandlerRef.current?.(false, false); 
                             return; // Dừng việc tính đếm ngược F11 tạm thời do đã văng lỗi kia nặng hơn
                        }

                        const now = Date.now();
                        const diffSec = Math.ceil((targetTime - now) / 1000);

                        if (diffSec <= 0) {
                            // Hết 10s cố tình không F11 -> Vi phạm Fullscreen
                            violationHandlerRef.current?.(true);
                            targetTime = Date.now() + durationMs; // Reset lại vòng lặp 10s nếu vẫn cố chấp chờ
                        }

                        // Render lại UI với số giây mới
                        setFullscreenWarningTimeLeft(Math.max(0, diffSec));
                    }, 500); // Check mỗi 0.5s để mượt hơn thay vì 1s
                }
            } else {
                // Đã quay lại F11
                if ('keyboard' in navigator && (navigator as any).keyboard && (navigator as any).keyboard.lock) {
                    (navigator as any).keyboard.lock().catch((e: any) => console.log('Keyboard lock failed:', e));
                }

                if (countdownTimer) {
                    clearInterval(countdownTimer);
                    countdownTimer = null;
                }
                setFullscreenWarningTimeLeft(null);
            }
        };

        const initialCheck = setTimeout(checkFullscreen, 1000);

        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('keydown', handleKeyDown);
        ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(event => {
            document.addEventListener(event, checkFullscreen);
        });

        return () => {
            clearTimeout(initialCheck);
            if (countdownTimer) clearInterval(countdownTimer);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('keydown', handleKeyDown);
            ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(event => {
                document.removeEventListener(event, checkFullscreen);
            });
            setFullscreenWarningTimeLeft(null);
        };
    }, [isExamMode]);

    // Component để inject vào UI
    const AntiCheatOverlay = fullscreenWarningTimeLeft !== null ? (
        <FullscreenWarningOverlay 
            timeLeft={fullscreenWarningTimeLeft} 
            onEnterFullscreen={() => {
                const elem = document.documentElement;
                if (elem.requestFullscreen) elem.requestFullscreen();
                else if ((elem as any).webkitRequestFullscreen) (elem as any).webkitRequestFullscreen();
                else if ((elem as any).msRequestFullscreen) (elem as any).msRequestFullscreen();
            }} 
        />
    ) : null;

    return {
        violationCount,
        scorePenalty,
        initViolations,
        AntiCheatOverlay,
        // bypass=true dành cho vi phạm Fullscreen (tab đang hiện nhưng không FullScreen)
        // force=true dành cho vi phạm nghiêm trọng (từ chối Camera)
        triggerViolation: (bypass = false, force = false) => violationHandlerRef.current?.(bypass, force)
    };
};
