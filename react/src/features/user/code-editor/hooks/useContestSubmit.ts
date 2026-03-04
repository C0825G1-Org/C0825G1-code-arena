import { useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../../../shared/services/axiosClient';
import { contestService } from '../../home/services/contestService';
import { Language } from './useArena';
import { LANGUAGE_NAME_TO_ID } from '../constants';
import { ContestDetailData } from '../../contests/pages/UserContestDetailPage';

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
    setActiveTab: (tab: 'problem' | 'submissions' | 'hints' | 'discussions') => void;
    setIsSubmitting: (val: boolean) => void;
    setIsSubmittingExit: (val: boolean) => void;
}

export const useContestSubmit = ({
    contestId,
    problemId,
    language,
    code,
    userId,
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

    const handleConfirmExit = async (status: string = 'FINISHED') => {
        if (!contestId) {
            blockerProceed();
            return;
        }

        setIsSubmittingExit(true);
        const currentContestId = parseInt(contestId);
        try {
            const alreadyDone = contest?.participantStatus === 'FINISHED' || contest?.participantStatus === 'DISQUALIFIED';

            if (!alreadyDone) {
                await submitAllProblems(currentContestId, status);
            }

            setIsConfirmExitOpen(false);
            if (blockerState === "blocked") {
                blockerProceed();
            } else {
                navigate(`/contests/${contestId}`, { replace: true });
            }
        } catch (error: any) {
            if (status === 'DISQUALIFIED') {
                navigate(`/contests/${contestId}`, { replace: true });
            } else {
                toast.error(`Không thể thoát: ${error.message}`);
                setIsSubmittingExit(false);
            }
        }
    };

    const handleManualExit = () => {
        if (isExamMode) {
            const isDone = contest?.participantStatus === 'FINISHED' || contest?.participantStatus === 'DISQUALIFIED';
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
                setProblemStatus(prev => ({ ...prev, [problemId]: { ...(prev[problemId] ?? { isAC: false }), submitCount: 50 } }));
            } else {
                toast.error("Có lỗi xảy ra khi nộp bài. Vui lòng thử lại!");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const submitAllProblems = async (currentContestId: number, status: string = 'FINISHED') => {
        const allLanguages = Object.keys(LANGUAGE_NAME_TO_ID) as Language[];
        const problemsToSubmit = contest?.problems || [];

        const submissionPromises = problemsToSubmit.map(async (p) => {
            const contextMode = `contest:${currentContestId}`;
            let bestLang: Language = language;
            let bestCode = '';
            for (const lang of allLanguages) {
                const key = `arena:code:${userId}:${contextMode}:${p.id}:${lang}`;
                const saved = localStorage.getItem(key);
                if (saved && saved.length > bestCode.length) {
                    bestCode = saved;
                    bestLang = lang;
                }
            }
            const finalLangId = LANGUAGE_NAME_TO_ID[bestLang] ?? 1;
            return axiosClient.post('/submissions', {
                problemId: p.id,
                languageId: finalLangId,
                sourceCode: bestCode,
                isRunOnly: false,
                contestId: currentContestId
            }).catch(() => { });
        });

        await Promise.allSettled(submissionPromises);
        try {
            await contestService.finishContest(currentContestId, status);
            localStorage.setItem(`arena:contest_finished:${currentContestId}`, Date.now().toString());
        } catch (finishErr) {
            console.warn('finishContest warning:', finishErr);
        }
    };

    return {
        isConfirmExitOpen,
        setIsConfirmExitOpen,
        isConfirmSubmitOpen,
        setIsConfirmSubmitOpen,
        handleConfirmExit,
        handleManualExit,
        submitLogic,
        submitAllProblems
    };
};
