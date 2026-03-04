import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { contestService } from '../../home/services/contestService';
import {
    ViolationToastContent,
    InitViolationToastContent,
    DisqualifiedToastContent,
    FullscreenWarningToastContent
} from '../components/AntiCheatToasts';

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
        let countdownTimer: ReturnType<typeof setInterval> | null = null;
        let timeLeft = 10;

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
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
                if (!countdownTimer) {
                    timeLeft = 10;
                    toast(
                        <FullscreenWarningToastContent
                            timeLeft={timeLeft}
                            onEnterFullscreen={() => {
                                enterFullscreen();
                                toast.dismiss(toastId);
                            }}
                        />,
                        {
                            toastId: toastId,
                            autoClose: false,
                            position: "top-center",
                            style: { border: '2px solid #ef4444', backgroundColor: '#fee2e2' }
                        }
                    );

                    countdownTimer = setInterval(() => {
                        timeLeft -= 1;
                        if (timeLeft <= 0) {
                            // Ghi nhận 1 vi phạm rớt F11
                            if (violationHandlerRef.current) {
                                violationHandlerRef.current();
                            }
                            timeLeft = 10; // Đếm lại từ vòng mới
                        }

                        // Render lại UI với số giây mớI
                        toast.update(toastId, {
                            render: (
                                <FullscreenWarningToastContent
                                    timeLeft={timeLeft}
                                    onEnterFullscreen={() => {
                                        enterFullscreen();
                                        toast.dismiss(toastId);
                                    }}
                                />
                            ),
                            position: "top-center",
                            style: { border: '2px solid #ef4444', backgroundColor: '#fee2e2' }
                        });
                    }, 1000);
                }
            } else {
                // Đã quay lại F11
                if (countdownTimer) {
                    clearInterval(countdownTimer);
                    countdownTimer = null;
                }
                toast.dismiss(toastId);
            }
        };

        const initialCheck = setTimeout(checkFullscreen, 1000);

        document.addEventListener('contextmenu', handleContextMenu);
        ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(event => {
            document.addEventListener(event, checkFullscreen);
        });

        return () => {
            clearTimeout(initialCheck);
            if (countdownTimer) clearInterval(countdownTimer);
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
