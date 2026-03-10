import { useEffect } from 'react';
import { useBlocker, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

interface UseContestSyncProps {
    isExamMode: boolean;
    isWaitingRoom?: boolean;
    isSubmittingExit: boolean;
    contestStatus?: string;
    contestId?: string;
}

export const useContestSync = ({
    isExamMode,
    isWaitingRoom = false,
    isSubmittingExit,
    contestStatus,
    contestId
}: UseContestSyncProps) => {
    const navigate = useNavigate();

    // NAVIGATION BLOCKER
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) => {
            if (!isExamMode || isSubmittingExit || isWaitingRoom) return false;

            // Nếu đã thi xong (FINISHED) hoặc bị trục xuất (DISQUALIFIED), không chặn navigate
            const isDone = contestStatus === 'FINISHED' || contestStatus === 'DISQUALIFIED';
            if (isDone) return false;

            if (currentLocation.pathname === nextLocation.pathname) return false;

            // URL thực tế: /code-editor/:problemId?contestId=xxx
            // Cho phép chuyển bài trong CÙNG contest bằng cách kiểm tra query param contestId
            const isCodeEditorRoute = (path: string) => /^\/code-editor\/\d+/.test(path);

            if (isCodeEditorRoute(currentLocation.pathname) && isCodeEditorRoute(nextLocation.pathname)) {
                const currentContestId = new URLSearchParams(currentLocation.search).get('contestId');
                const nextContestId = new URLSearchParams(nextLocation.search).get('contestId');
                // Nếu cùng contestId -> chỉ là chuyển câu, không chặn
                if (currentContestId && nextContestId && currentContestId === nextContestId) {
                    return false;
                }
            }

            return true; // Chặn thoát khỏi trang thi (back, đổi URL sang trang khác...)
        }
    );

    // 1. BEFORE UNLOAD: Cảnh báo + tính vi phạm khi F5, đóng tab, hoặc đổi URL
    useEffect(() => {
        // Chỉ kích hoạt khi đang thi (JOINED) và không phải đang submit/thoát chính thức
        const isDone = contestStatus === 'FINISHED' || contestStatus === 'DISQUALIFIED';
        if (!isExamMode || isSubmittingExit || isWaitingRoom || isDone || !contestId) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            // Chỉ gửi báo cáo nếu trang đang ở trạng thái hiển thị (VISIBLE)
            // Nếu trang đã ẩn (HIDDEN), logic visibilitychange trong useAntiCheat đã xử lý báo cáo rồi.
            if (document.visibilityState === 'visible') {
                const token = localStorage.getItem('token');
                if (token) {
                    fetch(`http://localhost:8080/api/contests/${contestId}/violation`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        keepalive: true
                    }).catch(() => { });
                }
            }
            // Hiển thị dialog xác nhận của trình duyệt
            e.preventDefault();
            e.returnValue = '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isExamMode, isSubmittingExit, isWaitingRoom, contestStatus, contestId]);

    // 2. CROSS-TAB SYNC: Thoát nếu đã thoát ở Tab khác
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'user' && !e.newValue) {
                navigate('/login');
            }
            // Chỉ redirect nếu tab hiện tại chưa có contest đang active
            // (Tránh trường hợp submit thành công ở tab 1 làm redirect tab 2 đang thi)
            // Không handle ở đây - khi user submit xong họ sẽ tự biết cần tải lại nếu cần
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [navigate, contestId]);

    return { blocker };
};
