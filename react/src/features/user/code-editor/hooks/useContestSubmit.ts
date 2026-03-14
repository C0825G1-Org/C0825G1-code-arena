import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../../../shared/services/axiosClient';
import { contestService } from '../../home/services/contestService';
import { Language } from './useArena';
import { LANGUAGE_NAME_TO_ID } from '../constants';
import { ContestDetailData } from '../../contests/pages/UserContestDetailPage';
import { useSocket } from '../../../../shared/hooks/useSocket';

interface UseContestSubmitProps {
    contestId: string | null;
    problemId: number;
    language: Language;
    code: string;
    userId?: number;
    isExamMode: boolean;
    isWaitingRoom: boolean;
    contest: ContestDetailData | null;
    blockerState: string;
    blockerProceed: () => void;
    setProblemStatus: React.Dispatch<React.SetStateAction<Record<number, { submitCount: number, isAC: boolean }>>>;
    setActiveTab: (tab: 'problem' | 'submissions' | 'hints' | 'discussion') => void;
    setIsSubmitting: (val: boolean) => void;
    setIsSubmittingExit: (val: boolean) => void;
}

export const useContestSubmit = ({
    contestId,
    problemId,
    language,
    code,
    isExamMode,
    isWaitingRoom,
    contest,
    blockerState,
    blockerProceed,
    setProblemStatus,
    setActiveTab,
    setIsSubmitting,
    setIsSubmittingExit
}: UseContestSubmitProps) => {
    const navigate = useNavigate();
    const [isConfirmExitOpen, setIsConfirmExitOpen] = useState(false);
    const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);

    // Lắng nghe kết quả socket: cập nhật màu nút bài realtime
    // - AC  → nút xanh (isAC = true)
    // - WA/TLE/MLE/RE → nút cam (submitCount đã tăng khi submit, nhưng cũng confirm lại từ socket)
    const handleSocketMessage = useCallback((data: any) => {
        // Một số trường hợp data trả về bị bọc trong thuộc tính data
        const payload = data?.data || data;
        
        if (!isExamMode || !payload?.problemId) return;
        if (payload.isRunOnly) return;
        
        const pid = payload.problemId;
        if (payload.status === 'AC') {
            setProblemStatus(prev => ({
                ...prev,
                [pid]: { ...(prev[pid] ?? { submitCount: 0, isAC: false }), isAC: true }
            }));
        } else if (payload.status === 'WA' || payload.status === 'TLE' || payload.status === 'MLE' || payload.status === 'RE') {
            setProblemStatus(prev => {
                const cur = prev[pid] ?? { submitCount: 0, isAC: false };
                if (cur.isAC) return prev;
                return { ...prev, [pid]: { ...cur, submitCount: Math.max(cur.submitCount, 1) } };
            });
        }
    }, [isExamMode, setProblemStatus]);

    useSocket(handleSocketMessage);

    /**
     * Kết thúc lượt thi và thoát trang.
     *
     * THIẾT KẾ CÓ CHỦ Ý: Hệ thống KHÔNG tự nộp bài thay thí sinh khi thoát.
     * Thí sinh phải tự bấm "Nộp bài" cho từng challenge trước khi thoát.
     * Dialog xác nhận thoát nhắc rõ điều này để tránh nhầm lẫn.
     */
    const handleConfirmExit = async (status: string = 'FINISHED') => {
        if (!contestId) {
            if (blockerState === "blocked") {
                blockerProceed();
            } else {
                navigate('/problems');
            }
            return;
        }

        setIsSubmittingExit(true);
        const currentContestId = parseInt(contestId);
        try {
            const alreadyDone =
                contest?.participantStatus === 'FINISHED' ||
                contest?.participantStatus === 'DISQUALIFIED';

            if (!alreadyDone) {
                // Chỉ đánh dấu kết thúc lượt thi trên server — không tự nộp bài thay thí sinh
                await contestService.finishContest(currentContestId, status);
                localStorage.setItem(`arena:contest_finished:${currentContestId}`, Date.now().toString());
            }

            setIsConfirmExitOpen(false);
            if (blockerState === "blocked") {
                blockerProceed();
            } else {
                navigate(`/contests/${contestId}`, { replace: true });
            }
        } catch (error: any) {
            toast.error(`Không thể thoát: ${error.message}`);
            setIsSubmittingExit(false);
        }
    };

    const handleManualExit = () => {
        if (isExamMode) {
            const isDone =
                contest?.participantStatus === 'FINISHED' ||
                contest?.participantStatus === 'DISQUALIFIED';
            if (isDone || isWaitingRoom) {
                navigate(`/contests/${contestId}`);
            } else {
                setIsConfirmExitOpen(true);
            }
        } else {
            navigate('/problems');
        }
    };

    const submitLogic = async (isRunOnly: boolean, isAuthenticated: boolean) => {
        if (!isAuthenticated) {
            toast.info("Vui lòng đăng nhập để nộp bài!");
            navigate('/login');
            return;
        }

        const langId = LANGUAGE_NAME_TO_ID[language] ?? 1;
        setIsSubmitting(true);
        try {
            await contestService.submit({
                problemId,
                languageId: langId,
                sourceCode: code,
                isRunOnly,
                ...(isExamMode ? { contestId: parseInt(contestId!) } : {})
            });

            toast.success(isRunOnly ? "Đang chạy thử..." : "Đã nộp bài, đang chờ hệ thống chấm...");
            setActiveTab('submissions');

            if (isExamMode && !isRunOnly) {
                setProblemStatus(prev => {
                    const cur = prev[problemId] ?? { submitCount: 0, isAC: false };
                    return { ...prev, [problemId]: { ...cur, submitCount: cur.submitCount + 1 } };
                });
            }
        } catch (error: any) {
            if (error?.response?.data?.message?.includes("50 lần")) {
                toast.error("⚠️ Bạn đã đạt giới hạn 50 lần nộp bài!");
                setProblemStatus(prev => ({
                    ...prev,
                    [problemId]: { ...(prev[problemId] ?? { isAC: false }), submitCount: 50 }
                }));
            } else {
                toast.error("Có lỗi xảy ra khi nộp bài. Vui lòng thử lại!");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        isConfirmExitOpen,
        setIsConfirmExitOpen,
        isConfirmSubmitOpen,
        setIsConfirmSubmitOpen,
        handleConfirmExit,
        handleManualExit,
        submitLogic
    };
};
