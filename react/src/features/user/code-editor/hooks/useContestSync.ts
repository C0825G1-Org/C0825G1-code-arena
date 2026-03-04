import { useEffect } from 'react';
import { useBlocker, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

interface UseContestSyncProps {
    isExamMode: boolean;
    isSubmittingExit: boolean;
    contestStatus?: string;
    contestId?: string;
}

export const useContestSync = ({
    isExamMode,
    isSubmittingExit,
    contestStatus,
    contestId
}: UseContestSyncProps) => {
    const navigate = useNavigate();

    // NAVIGATION BLOCKER
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) => {
            if (!isExamMode || isSubmittingExit) return false;

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

    // 1. BEFORE UNLOAD: Cảnh báo khi F5 hoặc Đóng tab
    useEffect(() => {
        if (!isExamMode || isSubmittingExit) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = ''; // Hiển thị dialog mặc định của trình duyệt
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isExamMode, isSubmittingExit]);

    // 2. CROSS-TAB SYNC: Thoát nếu đã thoát ở Tab khác
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'user' && !e.newValue) {
                navigate('/login');
            }
            if (e.key && e.key.startsWith('arena:contest_finished:') && e.newValue) {
                const finishedId = e.key.split(':').pop();
                if (finishedId === contestId) {
                    toast.info("Lượt thi đã được kết thúc ở tab khác.");
                    navigate(`/contests/${contestId}`, { replace: true });
                }
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [navigate, contestId]);

    return { blocker };
};
