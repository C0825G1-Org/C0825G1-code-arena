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
import { boilerplateMap, BACKEND_LANGUAGE_TO_EDITOR } from "../constants";
import { useSettings } from "../hooks/useSettings";
import { useCameraSnapshot } from '../hooks/useCameraSnapshot';
import { useAntiCheat } from '../hooks/useAntiCheat';
import { useContestSync } from '../hooks/useContestSync';
import { useWaitingRoomTimer } from '../hooks/useWaitingRoomTimer';
import { useContestSubmit } from '../hooks/useContestSubmit';

import { EditorHeader } from '../components/EditorHeader';
import { ProblemStrip } from '../components/ProblemStrip';
import { ActionToolbar } from '../components/ActionToolbar';
import { Clock, LockKey, PlayCircle } from '@phosphor-icons/react';

export default function Home() {
    const [searchParams] = useSearchParams();
    const contestId = searchParams.get('contestId');
    const isExamMode = !!contestId;

    const { problemId: problemIdStr } = useParams<{ problemId: string }>();
    const problemId = problemIdStr ? parseInt(problemIdStr, 10) : 1;
    // Biết ngay từ đầu (từ localStorage) nếu đây là lượt xem lại bài thi
    // Để chặn useArena auto-load localStorage đè lên code do API trả về
    const examReadOnly = isExamMode && !!localStorage.getItem(`arena:contest_finished:${contestId || '0'}`);
    const { language, code, setCode, changeLanguage, resetCode } = useArena(problemId, contestId, examReadOnly);

    const { settings, updateSettings } = useSettings();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
    const userId = user?.id;

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [testCases, setTestCases] = useState<TestCase[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmittingExit, setIsSubmittingExit] = useState(false);
    const [activeTab, setActiveTab] = useState<'problem' | 'submissions' | 'hints' | 'discussions'>('problem');

    const [problemStatus, setProblemStatus] = useState<Record<number, { submitCount: number, isAC: boolean }>>({});
    const [contest, setContest] = useState<ContestDetailData | null>(null);

    // Sử dụng Custom Hooks mới tách
    const isWaitingRoom = isExamMode && contest?.status === 'upcoming';
    const { blocker } = useContestSync({
        isExamMode,
        isWaitingRoom,
        isSubmittingExit,
        contestStatus: contest?.participantStatus,
        contestId: contestId || undefined
    });

    const {
        isConfirmExitOpen, setIsConfirmExitOpen,
        isConfirmSubmitOpen, setIsConfirmSubmitOpen,
        handleConfirmExit, handleManualExit, submitLogic, submitAllProblems
    } = useContestSubmit({
        contestId, problemId, language, code, userId,
        isExamMode, isWaitingRoom, contest,
        blockerState: blocker.state,
        blockerProceed: () => blocker.proceed && blocker.proceed(),
        setProblemStatus, setActiveTab,
        setIsSubmitting, setIsSubmittingExit
    });

    const { serverOffset, waitingTimeLeftStr, isTimeUp, setIsTimeUp } = useWaitingRoomTimer({
        contest,
        onTimeUp: () => {
            if (contestId) {
                contestService.getContestDetail(parseInt(contestId))
                    .then(data => {
                        setContest(data);
                        if (data?.problems) {
                            const statusMap: Record<number, { submitCount: number, isAC: boolean }> = {};
                            data.problems.forEach((p: any) => {
                                statusMap[p.id] = { submitCount: p.submitCount ?? 0, isAC: !!p.isAC };
                            });
                            setProblemStatus(statusMap);
                        }
                        toast.success("Kỳ thi đã bắt đầu. Chúc bạn thi tốt!");
                    })
                    .catch(e => {
                        console.error("API Error", e);
                        toast.error("Vui lòng tải lại trang (F5)!");
                    });
            }
        }
    });

    const { initViolations, triggerViolation } = useAntiCheat({
        isExamMode: isExamMode && !!contest && contest.status === 'active',
        contestId: contestId || undefined,
        onDisqualified: async () => {
            if (!contestId || !contest) return;
            const currentContestId = parseInt(contestId);

            // Bước 1: Cập nhật state local để UI chuyển sang read-only ngay lập tức
            setIsTimeUp(true);
            setContest(prev => prev ? { ...prev, participantStatus: 'DISQUALIFIED' } : prev);

            // Bước 2: Nộp tất cả bài + gọi API finish ở nền (không redirect)
            try {
                await submitAllProblems(currentContestId, 'DISQUALIFIED');
            } catch (e) {
                console.warn('Disqualified API error:', e);
            }
            // Không navigate - ở lại trang read-only, thí sinh tự bấm Exit
        }
    });

    const { isCapturing } = useCameraSnapshot({
        contestId: contestId ? parseInt(contestId) : 0,
        enabled: isExamMode && !!contest && contest.status === 'active' && contest.participantStatus === 'JOINED' && !isTimeUp,
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
                        initViolations(data.violationCount, !!data.hasScorePenalty, data.participantStatus);
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
                        // Đặt flag vào localStorage để examReadOnly = true khi component re-render
                        localStorage.setItem(`arena:contest_finished:${contestId}`, Date.now().toString());
                        // Lấy code từ lần nộp cuối cùng của bài này trong cuộc thi
                        axiosClient.get(`/submissions/me`, {
                            params: { problemId, contestId: parseInt(contestId!) }
                        }).then((submissions: any) => {
                            const list: any[] = Array.isArray(submissions) ? submissions : (submissions?.data ?? []);
                            if (list.length > 0) {
                                const last = list[0]; // Đã sắp xếp DESC từ API
                                const mappedLang = BACKEND_LANGUAGE_TO_EDITOR[last.languageName] as any;
                                // Đổi ngôn ngữ trước
                                if (mappedLang) changeLanguage(mappedLang);
                                // Set code SAU (timeout nhỏ để tránh bị effect localStorage overwrite)
                                setTimeout(() => {
                                    // Nếu code rỗng/trắng thì dùng boilerplate mặc định
                                    const codeToShow = last.sourceCode?.trim()
                                        ? last.sourceCode
                                        : (boilerplateMap[mappedLang as Language] ?? '');
                                    setCode(codeToShow);
                                }, 100);
                            }
                        }).catch(console.warn);
                    }
                })
                .catch(err => console.error("API Error:", err));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isExamMode, isAuthenticated, navigate, location.pathname, location.search, contestId]);

    useEffect(() => {
        setActiveTab('problem');
        // Chỉ fetch sample test cases nếu không ở trong phòng chờ
        if (!isExamMode || contest?.status !== 'upcoming') {
            getSampleTestCases(problemId).then(setTestCases).catch(console.error);
        }
    }, [problemId, isExamMode, contest?.status]);

    useEffect(() => {
        if (blocker.state === "blocked") {
            setIsConfirmExitOpen(true);
        }
    }, [blocker.state]);




    const problemsList = contest?.problems?.sort((a, b) => a.orderIndex - b.orderIndex) || [];
    const currentProblemIndex = problemsList.findIndex(p => p.id === problemId);

    const getLabel = (index: number) => (index + 1).toString();

    const isReadOnly = isTimeUp || (isExamMode && contest?.participantStatus !== 'JOINED') || (contest?.status === 'upcoming');

    return (
        <div className={`h-screen bg-[#0f172a] text-slate-300 flex flex-col overflow-hidden font-sans relative ${isExamMode && !isWaitingRoom ? 'border-4 border-red-500/30' : ''}`}>
            {isExamMode && !isWaitingRoom && <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(239,68,68,0.15)] z-0"></div>}

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
                isWaitingRoom={isWaitingRoom}
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

            {isExamMode && problemsList.length > 0 && !isWaitingRoom && (
                <ProblemStrip
                    problemsList={problemsList}
                    currentProblemIndex={currentProblemIndex}
                    problemStatus={problemStatus}
                    onGoPrev={() => navigate(`/code-editor/${problemsList[currentProblemIndex - 1].id}?contestId=${contestId}`)}
                    onGoNext={() => navigate(`/code-editor/${problemsList[currentProblemIndex + 1].id}?contestId=${contestId}`)}
                    onSelectProblem={(id) => navigate(`/code-editor/${id}?contestId=${contestId}`)}
                />
            )}

            <div className="flex-1 w-full relative bg-[#0f172a] p-2 overflow-hidden">
                {isWaitingRoom ? (
                    <div className="h-full flex flex-col items-center justify-center relative rounded-xl border border-white/5 bg-[#1e293b] overflow-y-auto shadow-2xl">
                        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-amber-900/10 to-transparent pointer-events-none" />
                        <div className="absolute top-[20%] left-[30%] w-[40%] h-[40%] bg-amber-600/5 blur-[120px] rounded-full pointer-events-none" />

                        <div className="z-10 flex flex-col items-center p-8 bg-[#0f172a]/60 backdrop-blur-md rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                            <LockKey size={64} weight="duotone" className="text-amber-500 mb-6 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">KỲ THI CHƯA BẮT ĐẦU</h2>
                            <p className="text-slate-400 mb-8 max-w-md text-center">Bạn đang ở phòng chờ. Đề thi, công cụ biên dịch và các chức năng khác đã được khóa để đảm bảo công bằng.</p>

                            <div className="bg-[#0f172a] px-8 py-6 rounded-2xl border border-amber-500/30 shadow-[inset_0_0_30px_rgba(245,158,11,0.05)] w-full text-center">
                                <span className="text-slate-500 font-bold uppercase tracking-widest text-sm block mb-3 border-b border-white/5 pb-2">Thời gian đếm ngược</span>
                                <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-300 to-orange-500 font-mono tracking-wider tabular-nums">
                                    {waitingTimeLeftStr}
                                </div>
                            </div>

                            <div className="mt-8 flex items-center gap-3 text-amber-500/80 bg-amber-500/10 px-6 py-3 rounded-full border border-amber-500/20 text-sm font-medium">
                                <Clock size={20} weight="fill" className="animate-pulse" />
                                <span>Hệ thống sẽ tự động tải lại khi đến giờ</span>
                            </div>

                            <button
                                onClick={() => navigate('/tutorial')}
                                className="mt-6 flex items-center gap-2 px-6 py-2.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-xl border border-blue-500/30 transition-all font-bold text-sm shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:scale-105"
                            >
                                <PlayCircle weight="fill" className="text-xl animate-pulse" /> Xem hướng dẫn thi giả lập
                            </button>
                        </div>
                    </div>
                ) : (
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
                                        onRunCode={() => submitLogic(true, isAuthenticated)}
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
                                                            <div className="bg-[#0f172a] text-slate-300 p-2 md:p-3 rounded border border-white/5 overflow-x-auto">{(tc as any).inputData ?? (tc as any).sampleInput}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-slate-400 mb-1 text-[10px] md:text-xs">Expected:</div>
                                                            <div className="bg-[#0f172a] text-emerald-400 p-2 md:p-3 rounded border border-white/5 overflow-x-auto">{(tc as any).expectedOutput ?? (tc as any).sampleOutput}</div>
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
                )}
            </div>

            <ConfirmExitModal
                isOpen={isConfirmExitOpen}
                isExamMode={isExamMode}
                onConfirm={() => handleConfirmExit('FINISHED')}
                onCancel={() => {
                    setIsConfirmExitOpen(false);
                    blocker.reset?.();
                }}
            />

            <ConfirmExitModal
                isOpen={isConfirmSubmitOpen}
                title="Xác nhận nộp bài"
                description={`Bạn chuẩn bị nộp bài Câu ${getLabel(currentProblemIndex)}. Hệ thống sẽ chạy toàn bộ Test ẩn và gửi báo cáo về máy chủ chấm. Bạn có chắc chắn muốn nộp?`}
                confirmText={`Nộp bài (${problemStatus[problemId]?.submitCount ?? 0}/50)`}
                cancelText="Hủy"
                isExamMode={isExamMode}
                onConfirm={() => {
                    setIsConfirmSubmitOpen(false);
                    submitLogic(false, isAuthenticated);
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