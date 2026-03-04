import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import Split from "react-split";
import { RootState } from "../../../../app/store";
import axiosClient from "../../../../shared/services/axiosClient";

import CodeEditor from "../components/CodeEditor";
import ProblemPanel from "../components/ProblemPanel";
import SubmissionHistory from "../components/SubmissionHistory";
import { ConfirmExitModal } from '../components/ConfirmExitModal';
import { ContestDetailData } from "../../contests/pages/UserContestDetailPage";
import { contestService } from "../../home/services/contestService";
import { getSampleTestCases, TestCase } from "../services/problemService";

import { useArena, Language } from "../hooks/useArena";
import { useSettings } from "../hooks/useSettings";
import { useCameraSnapshot } from '../hooks/useCameraSnapshot';
import { useAntiCheat } from '../hooks/useAntiCheat';
import { useContestSync } from '../hooks/useContestSync';

import { EditorHeader } from '../components/EditorHeader';
import { ProblemStrip } from '../components/ProblemStrip';
import { ActionToolbar } from '../components/ActionToolbar';

export default function Home() {
    const [searchParams] = useSearchParams();
    const contestId = searchParams.get('contestId');
    const isExamMode = !!contestId;

    const { problemId: problemIdStr } = useParams<{ problemId: string }>();
    const problemId = problemIdStr ? parseInt(problemIdStr, 10) : 1;
    const { language, code, setCode, changeLanguage, resetCode } = useArena(problemId, contestId);

    const { settings, updateSettings } = useSettings();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
    const userId = user?.id;

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [testCases, setTestCases] = useState<TestCase[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmittingExit, setIsSubmittingExit] = useState(false);
    const [isConfirmExitOpen, setIsConfirmExitOpen] = useState(false);
    const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'problem' | 'submissions' | 'hints' | 'discussions'>('problem');

    const [problemStatus, setProblemStatus] = useState<Record<number, { submitCount: number, isAC: boolean }>>({});
    const [contest, setContest] = useState<ContestDetailData | null>(null);
    const [isTimeUp, setIsTimeUp] = useState(false);

    // Sử dụng Custom Hooks mới tách
    const { blocker } = useContestSync({
        isExamMode,
        isSubmittingExit,
        contestStatus: contest?.participantStatus,
        contestId: contestId || undefined
    });

    const { initViolations, triggerViolation } = useAntiCheat({
        isExamMode,
        contestId: contestId || undefined,
        onDisqualified: () => {
            setIsTimeUp(true);
            handleConfirmExit('DISQUALIFIED');
        }
    });

    const { isCapturing } = useCameraSnapshot({
        contestId: contestId ? parseInt(contestId) : 0,
        enabled: isExamMode && !!contest && contest.participantStatus === 'JOINED' && !isTimeUp,
        interval: 60000,
        onCameraRefused: () => triggerViolation()
    });

    useEffect(() => {
        if (isExamMode && !isAuthenticated) {
            navigate('/login', { state: { from: location.pathname + location.search }, replace: true });
            return;
        }

        if (isExamMode && contestId) {
            contestService.getContestDetail(parseInt(contestId))
                .then(data => {
                    setContest(data);
                    if (data.violationCount !== undefined) {
                        initViolations(data.violationCount, !!data.hasScorePenalty);
                    }

                    if (data?.problems) {
                        const statusMap: Record<number, { submitCount: number, isAC: boolean }> = {};
                        data.problems.forEach((p: any) => {
                            statusMap[p.id] = { submitCount: p.submitCount ?? 0, isAC: !!p.isAC };
                        });
                        setProblemStatus(statusMap);
                    }

                    if (data.participantStatus === 'FINISHED' || data.participantStatus === 'DISQUALIFIED') {
                        toast.info(data.participantStatus === 'DISQUALIFIED' ? "Bài thi đã bị khóa do vi phạm. Chế độ chỉ xem." : "Bạn đã hoàn thành lượt thi. Chế độ chỉ xem.", { toastId: 'contest-done-status' });
                    }
                })
                .catch(err => console.error("API Error:", err));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isExamMode, isAuthenticated, navigate, location.pathname, location.search, contestId]);

    useEffect(() => {
        setActiveTab('problem');
        getSampleTestCases(problemId).then(setTestCases).catch(console.error);
    }, [problemId]);

    useEffect(() => {
        if (blocker.state === "blocked") {
            setIsConfirmExitOpen(true);
        }
    }, [blocker.state]);

    const handleConfirmExit = async (status: string = 'FINISHED') => {
        if (!contestId) {
            blocker.proceed?.();
            return;
        }

        setIsSubmittingExit(true);
        try {
            const currentContestId = parseInt(contestId);
            const alreadyDone = contest?.participantStatus === 'FINISHED' || contest?.participantStatus === 'DISQUALIFIED';

            if (!alreadyDone) {
                const languageIdMap: Record<string, number> = { 'cpp': 1, 'java': 2, 'python': 3, 'javascript': 4 };
                const allLanguages = Object.keys(languageIdMap) as Language[];
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
                    const finalLangId = languageIdMap[bestLang] ?? 1;
                    return axiosClient.post('/submissions', {
                        problemId: p.id,
                        languageId: finalLangId,
                        sourceCode: bestCode,
                        isRunOnly: false,
                        contestId: currentContestId
                    }).catch(() => { });
                });

                await Promise.allSettled(submissionPromises);
                await contestService.finishContest(currentContestId, status);
                localStorage.setItem(`arena:contest_finished:${currentContestId}`, Date.now().toString());
                toast.success(status === 'DISQUALIFIED' ? "Bài thi đã bị khóa do vi phạm!" : "Đã nộp bài và kết thúc lượt thi!");
            }

            setIsConfirmExitOpen(false);
            if (blocker.state === "blocked") {
                blocker.proceed?.();
            } else if (status === 'DISQUALIFIED') {
                contestService.getContestDetail(currentContestId).then(setContest).catch(console.error);
                setIsSubmittingExit(false);
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
            const isDone = contest?.participantStatus === 'FINISHED' || contest?.participantStatus === 'DISQUALIFIED';
            if (isDone) {
                navigate(`/contests/${contestId}`);
            } else {
                setIsConfirmExitOpen(true);
            }
        } else {
            navigate('/contests');
        }
    };

    const submitLogic = async (isRunOnly: boolean) => {
        if (!isAuthenticated) {
            toast.info("Vui lòng đăng nhập để nộp bài!");
            navigate('/login');
            return;
        }

        const langId = { 'cpp': 1, 'java': 2, 'python': 3, 'javascript': 4 }[language] ?? 1;
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

    const problemsList = contest?.problems?.sort((a, b) => a.orderIndex - b.orderIndex) || [];
    const currentProblemIndex = problemsList.findIndex(p => p.id === problemId);

    const getLabel = (index: number) => (index + 1).toString();

    const isReadOnly = isTimeUp || (isExamMode && contest?.participantStatus !== 'JOINED');

    return (
        <div className={`h-screen bg-[#0f172a] text-slate-300 flex flex-col overflow-hidden font-sans relative ${isExamMode ? 'border-4 border-red-500/30' : ''}`}>
            {isExamMode && <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(239,68,68,0.15)] z-0"></div>}

            {isSubmitting && (
                <div className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center">
                    <div className="bg-[#1e293b] p-8 rounded-2xl border border-white/10 shadow-2xl flex flex-col items-center max-w-sm w-full mx-4">
                        <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
                            <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-2xl animate-pulse">🚀</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 text-center">Đang gửi bài nộp</h3>
                        <p className="text-slate-400 text-sm text-center mb-6">Mã nguồn của bạn đang được biên dịch và chạy trên hệ thống máy chấm.</p>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full animate-[progress_2s_ease-in-out_infinite]" style={{ width: '60%' }}></div>
                        </div>
                    </div>
                </div>
            )}

            <EditorHeader
                isExamMode={isExamMode}
                contestId={contestId || undefined}
                problemId={problemId}
                isCapturing={isCapturing}
                contestTitle={contest?.title}
                contestEndTime={contest?.endTime}
                isTimeUp={isTimeUp}
                onTimeUp={() => {
                    if (!isTimeUp) {
                        setIsTimeUp(true);
                        toast.error("HẾT GIỜ LÀM BÀI! Tự động nộp toàn bộ bài...");
                        handleConfirmExit('FINISHED');
                    }
                }}
                onManualExit={handleManualExit}
            />

            {isExamMode && problemsList.length > 0 && (
                <ProblemStrip
                    problemsList={problemsList}
                    currentProblemIndex={currentProblemIndex}
                    problemStatus={problemStatus}
                    onGoPrev={() => navigate(`/code-editor/${problemsList[currentProblemIndex - 1].id}?contestId=${contestId}`)}
                    onGoNext={() => navigate(`/code-editor/${problemsList[currentProblemIndex + 1].id}?contestId=${contestId}`)}
                    onSelectProblem={(id) => navigate(`/code-editor/${id}?contestId=${contestId}`)}
                />
            )}

            <div className="flex-1 w-full relative bg-[#0f172a] p-2">
                <Split direction="horizontal" sizes={[40, 60]} minSize={300} gutterSize={8} className="split-horizontal h-full flex">
                    {/* Panel Trái */}
                    <div className="h-full flex flex-col bg-[#1e293b] rounded-xl overflow-hidden border border-white/5 shadow-2xl">
                        <div className="flex border-b border-white/5 bg-[#0f172a]/50 p-1 gap-1 flex-wrap">
                            <button className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 min-w-[100px] ${activeTab === 'problem' ? 'bg-[#1e293b] text-white shadow-sm border border-white/5' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'}`} onClick={() => setActiveTab('problem')}>Đề bài</button>
                            <button className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 min-w-[100px] ${activeTab === 'submissions' ? 'bg-[#1e293b] text-white shadow-sm border border-white/5' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'}`} onClick={() => setActiveTab('submissions')}>Báo cáo nộp bài</button>
                            {!isExamMode && (
                                <>
                                    <button className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 min-w-[100px] ${activeTab === 'hints' ? 'bg-[#1e293b] text-white shadow-sm border border-white/5' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'}`} onClick={() => setActiveTab('hints')}>Gợi ý</button>
                                    <button className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 min-w-[100px] ${activeTab === 'discussions' ? 'bg-[#1e293b] text-white shadow-sm border border-white/5' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'}`} onClick={() => setActiveTab('discussions')}>Thảo luận</button>
                                </>
                            )}
                        </div>
                        <div className="flex-1 overflow-hidden relative bg-[#0f172a]/20 tour-problem-panel">
                            {activeTab === 'problem' && <div className="absolute inset-0"><ProblemPanel problemId={problemId} contestId={contestId} /></div>}
                            {activeTab === 'submissions' && <div className="absolute inset-0"><SubmissionHistory problemId={problemId} contestId={contestId} /></div>}
                            {activeTab === 'hints' && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-slate-400">
                                    <span className="text-4xl mb-4">💡</span>
                                    <h4 className="text-lg font-bold text-white mb-2">Gợi ý & Hướng dẫn</h4>
                                    <p className="text-center max-w-sm">Trong chế độ luyện tập, bạn có thể xem gợi ý tiếp cận bài toán.</p>
                                    <button className="mt-4 px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/20 font-medium hover:bg-blue-600/30 transition-colors">Mở khóa gợi ý</button>
                                </div>
                            )}
                            {activeTab === 'discussions' && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-slate-400">
                                    <span className="text-4xl mb-4">💬</span>
                                    <h4 className="text-lg font-bold text-white mb-2">Cộng đồng Thảo luận</h4>
                                    <p className="text-center max-w-sm">Tham gia thảo luận cùng các người chơi khác.</p>
                                    <span className="mt-4 px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-xs font-bold uppercase tracking-widest text-slate-300">Coming Soon</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Panel Phải */}
                    <div className="h-full flex flex-col min-w-0 bg-transparent rounded-xl overflow-hidden">
                        <Split direction="vertical" sizes={[70, 30]} minSize={100} gutterSize={8} className="split-vertical h-full flex flex-col">
                            <div className="flex flex-col overflow-hidden bg-[#1e293b] border border-white/5 shadow-2xl relative rounded-xl">
                                <ActionToolbar
                                    language={language}
                                    onChangeLanguage={changeLanguage}
                                    isSubmitting={isSubmitting}
                                    isTimeUp={isTimeUp}
                                    isExamMode={isExamMode}
                                    participantStatus={contest?.participantStatus}
                                    submitCount={problemStatus[problemId]?.submitCount ?? 0}
                                    isAC={problemStatus[problemId]?.isAC ?? false}
                                    onRunCode={() => submitLogic(true)}
                                    onSubmit={() => setIsConfirmSubmitOpen(true)}
                                    onResetCode={resetCode}
                                    isSettingsOpen={isSettingsOpen}
                                    onToggleSettings={setIsSettingsOpen}
                                    settings={settings}
                                    onUpdateSettings={updateSettings}
                                />
                                <div className="tour-code-editor flex-1 overflow-hidden relative">
                                    <CodeEditor
                                        language={language}
                                        value={code}
                                        onChange={isReadOnly ? () => { } : setCode}
                                        settings={settings}
                                        readOnly={isReadOnly}
                                    />
                                </div>
                            </div>

                            {/* Panel Test Cases (Nửa dưới bên phải) */}
                            <div className="flex flex-col overflow-hidden bg-[#1e293b] border border-white/5 shadow-2xl relative rounded-xl ml-2 md:ml-0 mt-2 md:mt-0">
                                <div className="flex border-b border-white/5 bg-[#0f172a]/50 p-2 gap-2">
                                    <div className="px-4 py-1.5 rounded-lg text-sm font-medium bg-[#1e293b] text-white shadow-sm border border-white/5 flex items-center gap-2">
                                        Test Cases
                                    </div>
                                </div>
                                <div className="flex-1 p-2 md:p-4 overflow-y-auto custom-scrollbar">
                                    {testCases.length > 0 ? (
                                        <div className="flex flex-wrap gap-2 md:gap-4">
                                            {testCases.map((tc, idx) => (
                                                <div key={tc.id} className="w-full md:flex-1 min-w-[200px] bg-[#0f172a]/30 rounded-xl p-3 md:p-4 border border-white/5 hover:border-blue-500/20 transition-all font-mono text-xs md:text-sm">
                                                    <div className="mb-2 text-slate-500 font-bold uppercase tracking-wider text-[10px] md:text-xs">Case {idx + 1}</div>
                                                    <div className="mb-2 md:mb-3">
                                                        <div className="text-slate-400 mb-1 text-[10px] md:text-xs">Input:</div>
                                                        <div className="bg-[#0f172a] text-slate-300 p-2 md:p-3 rounded border border-white/5 overflow-x-auto">{(tc as any).inputData}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-slate-400 mb-1 text-[10px] md:text-xs">Expected:</div>
                                                        <div className="bg-[#0f172a] text-emerald-400 p-2 md:p-3 rounded border border-white/5 overflow-x-auto">{(tc as any).expectedOutput}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-slate-500 pb-10">Không có test case mẫu.</div>
                                    )}
                                </div>
                            </div>
                        </Split>
                    </div>
                </Split>
            </div>

            {/* @ts-ignore */}
            <ConfirmExitModal
                isOpen={isConfirmExitOpen}
                isExamMode={isExamMode}
                onConfirm={() => handleConfirmExit('FINISHED')}
                onCancel={() => {
                    setIsConfirmExitOpen(false);
                    blocker.reset?.();
                }}
            />

            {/* @ts-ignore */}
            <ConfirmExitModal
                isOpen={isConfirmSubmitOpen}
                title="Xác nhận nộp bài"
                description={`Bạn chuẩn bị nộp bài Câu ${getLabel(currentProblemIndex)}. Hệ thống sẽ chạy toàn bộ Test ẩn và gửi báo cáo về máy chủ chấm. Bạn có chắc chắn muốn nộp?`}
                confirmText={`Nộp bài (${problemStatus[problemId]?.submitCount ?? 0}/50)`}
                cancelText="Hủy"
                isExamMode={isExamMode}
                onConfirm={() => {
                    setIsConfirmSubmitOpen(false);
                    submitLogic(false);
                }}
                onCancel={() => setIsConfirmSubmitOpen(false)}
            />
        </div>
    );
}

// Hàm phụ để hiển thị nhãn chữ cái A,B,C
function getLetter(index: number) {
    if (index < 0) return 'A';
    return String.fromCharCode(65 + index);
}