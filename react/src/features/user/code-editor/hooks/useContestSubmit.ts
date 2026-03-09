import { useState, useEffect } from 'react';
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
    useSocket((data: any) => {
        if (!isExamMode || !data?.problemId) return;
        if (data.isRunOnly) return;
        const pid = data.problemId;
        if (data.status === 'AC') {
            setProblemStatus(prev => ({
                ...prev,
                [pid]: { ...(prev[pid] ?? { submitCount: 0, isAC: false }), isAC: true }
            }));
        } else if (data.status === 'WA' || data.status === 'TLE' || data.status === 'MLE' || data.status === 'RE') {
            // Đảm bảo submitCount > 0 để nút hiển thị cam
            // (đã được tăng khi submit, nhưng confirm lại để tránh edge cases)
            setProblemStatus(prev => {
                const cur = prev[pid] ?? { submitCount: 0, isAC: false };
                if (cur.isAC) return prev; // Đã AC rồi thì giữ nguyên
                return { ...prev, [pid]: { ...cur, submitCount: Math.max(cur.submitCount, 1) } };
            });
        }
    });

    /**
     * Kết thúc lượt thi và thoát trang.
     *
     * THIẾT KẾ CÓ CHỦ Ý: Hệ thống KHÔNG tự nộp bài thay thí sinh khi thoát.
     * Thí sinh phải tự bấm "Nộp bài" cho từng challenge trước khi thoát.
     * Dialog xác nhận thoát nhắc rõ điều này để tránh nhầm lẫn.
     */
    const handleConfirmExit = async (status: string = 'FINISHED') => {
        if (!contestId) {
            blockerProceed();
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
            navigate('/contests');
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
            await axiosClient.post('/submissions', {
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
