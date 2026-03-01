import { useParams, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import CodeEditor from "../components/CodeEditor";
import ProblemPanel from "../components/ProblemPanel";
import LanguageSelector from "../components/LanguageSelector";
import Split from "react-split";
import SampleTestCases from "../components/SampleTestCases";
import SubmissionHistory from "../components/SubmissionHistory";
import ContestTimer from "../components/ContestTimer";
import { useEffect, useState } from "react";
import { getSampleTestCases, TestCase } from "../services/problemService";
import { useSettings } from "../hooks/useSettings";
import SettingsPopover from "../components/SettingsPopover";
import { useArena } from "../hooks/useArena";
import { ArrowCounterClockwise, DotsThreeVertical, Play, CaretLeft, CaretRight, ListBullets, CheckCircle } from "@phosphor-icons/react";
import axios from "axios";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { RootState } from "../../../../app/store";
import { contestService } from "../../home/services/contestService";
import { ContestDetailData } from "../../contests/pages/UserContestDetailPage";

export default function Home() {
    const { problemId: problemIdStr } = useParams<{ problemId: string }>();
    const problemId = problemIdStr ? parseInt(problemIdStr, 10) : 1; // Fallback to 1 if no param
    const { language, code, setCode, changeLanguage, resetCode } = useArena(problemId);
    const { settings, updateSettings } = useSettings();
    const navigate = useNavigate();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [testCases, setTestCases] = useState<TestCase[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'problem' | 'submissions'>('problem');

    const [searchParams] = useSearchParams();
    const contestId = searchParams.get('contestId');
    const isExamMode = !!contestId;

    // Contest Data
    const { isAuthenticated, token } = useSelector((state: RootState) => state.auth);
    const location = useLocation();
    const [contest, setContest] = useState<ContestDetailData | null>(null);

    useEffect(() => {
        // Guard: Nếu là bài thi mà chưa đăng nhập thì chuyển hướng sang login
        if (isExamMode && !isAuthenticated) {
            navigate('/login', {
                state: { from: location.pathname + location.search },
                replace: true
            });
            return;
        }

        // Fetch contest detail if in Exam Mode
        if (isExamMode && contestId) {
            contestService.getContestDetail(parseInt(contestId))
                .then(setContest)
                .catch(err => {
                    console.error("Failed to fetch contest detail for editor:", err);
                });
        }
    }, [isExamMode, isAuthenticated, navigate, location.pathname, location.search, contestId]);

    useEffect(() => {
        // Reset code context when switch problem
        setActiveTab('problem');
        getSampleTestCases(problemId).then(setTestCases).catch(console.error);
    }, [problemId]);

    const [isTimeUp, setIsTimeUp] = useState(false);

    // Anti-cheat & Fullscreen logic
    useEffect(() => {
        if (!isExamMode) return;

        const toastId = "fullscreen-prompt";

        const handlePreventCopyPaste = (e: ClipboardEvent) => {
            e.preventDefault();
            toast.warning("Hành động bị cấm trong kỳ thi!");
        };

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                toast.error("CẢNH BÁO: BẠN VỪA RỜI KHỎI MÀN HÌNH THI!", {
                    position: "top-center",
                    autoClose: 5000,
                    style: { fontWeight: 'bold' }
                });
            }
        };

        const checkFullscreen = () => {
            if (!document.fullscreenElement && !(document as any).webkitFullscreenElement && !(document as any).msFullscreenElement) {
                if (!toast.isActive(toastId)) {
                    toast.info(
                        <div className="flex flex-col gap-2">
                            <span className="font-bold">⚠️ Yêu cầu Toàn màn hình</span>
                            <span className="text-xs">Vui lòng bật chế độ Toàn màn hình để tiếp tục làm bài thi!</span>
                            <button
                                onClick={() => {
                                    const elem = document.documentElement;
                                    if (elem.requestFullscreen) elem.requestFullscreen();
                                    else if ((elem as any).webkitRequestFullscreen) (elem as any).webkitRequestFullscreen();
                                    else if ((elem as any).msRequestFullscreen) (elem as any).msRequestFullscreen();
                                    toast.dismiss(toastId);
                                }}
                                className="bg-blue-600 px-3 py-1.5 rounded text-white text-xs font-bold hover:bg-blue-700 transition-colors"
                            >
                                Bật Toàn màn hình (F11)
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

        // Initial check with delay to ensure DOM is ready
        const timer = setTimeout(checkFullscreen, 1000);

        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('copy', handlePreventCopyPaste);
        document.addEventListener('paste', handlePreventCopyPaste);
        document.addEventListener('contextmenu', handleContextMenu);

        // Fullscreen events for all browsers
        ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(event => {
            document.addEventListener(event, checkFullscreen);
        });

        return () => {
            clearTimeout(timer);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('copy', handlePreventCopyPaste);
            document.removeEventListener('paste', handlePreventCopyPaste);
            document.removeEventListener('contextmenu', handleContextMenu);
            ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(event => {
                document.removeEventListener(event, checkFullscreen);
            });
            toast.dismiss(toastId);
        };
    }, [isExamMode]);

    const handleRunCode = () => {
        submitLogic(true);
    };

    const handleSubmit = () => {
        submitLogic(false);
    };

    const submitLogic = async (isRunOnly: boolean) => {
        if (!isAuthenticated) {
            toast.info("Vui lòng đăng nhập để nộp bài!");
            navigate('/login', { state: { from: location.pathname + location.search } });
            return;
        }

        if (!code.trim()) {
            toast.warning("Mã nguồn không được để trống!");
            return;
        }

        // Map language string to language_id theo DB: 1=C++20, 2=Java21, 3=Python3.12, 4=JavaScript(Node20)
        const languageIdMap: Record<string, number> = {
            'cpp': 1,
            'java': 2,
            'python': 3,
            'javascript': 4,
        };
        const langId = languageIdMap[language] ?? 1;

        setIsSubmitting(true);
        try {
            const response = await axios.post('http://localhost:8080/api/submissions', {
                problemId: problemId,
                languageId: langId,
                sourceCode: code,
                isRunOnly: isRunOnly,
                ...(isExamMode ? { contestId: parseInt(contestId) } : {})
            }, {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            });

            if (response.status === 200) {
                toast.success(isRunOnly ? "Đang chạy thử..." : "Đã nộp bài, đang chờ hệ thống chấm...");
                setActiveTab('submissions');
            }
        } catch (error) {
            console.error("Lỗi khi nộp bài:", error);
            toast.error("Có lỗi xảy ra khi nộp bài. Vui lòng thử lại!");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Calculate Contest Navigation
    const problemsList = contest?.problems?.sort((a, b) => a.orderIndex - b.orderIndex) || [];
    const currentProblemIndex = problemsList.findIndex(p => p.id === problemId);

    // Fallback letters A,B,C...
    const getLetter = (index: number) => String.fromCharCode(65 + index);

    const goPrevProblem = () => {
        if (currentProblemIndex > 0) {
            navigate(`/code-editor/${problemsList[currentProblemIndex - 1].id}?contestId=${contestId}`);
        }
    };

    const goNextProblem = () => {
        if (currentProblemIndex < problemsList.length - 1) {
            navigate(`/code-editor/${problemsList[currentProblemIndex + 1].id}?contestId=${contestId}`);
        }
    };

    return (
        <div className="h-screen bg-slate-900 text-slate-300 flex flex-col overflow-hidden">
            {/* Contest Header Toolbar */}
            {isExamMode && problemsList.length > 0 && (
                <div className="h-14 bg-slate-800 border-b border-slate-700 font-medium px-4 flex items-center justify-between shrink-0 select-none shadow-sm z-10">
                    <div className="flex items-center gap-3">
                        <ListBullets weight="bold" className="text-xl text-blue-400" />
                        <span className="text-white text-lg font-bold">Kỳ thi: {contest?.title}</span>
                        {contest?.endTime && (
                            <div className="ml-4">
                                <ContestTimer
                                    endTime={contest.endTime}
                                    onTimeUp={() => {
                                        setIsTimeUp(true);
                                        toast.error("Thời gian làm bài đã kết thúc!", { autoClose: false });
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Problem Switcher */}
                    <div className="flex items-center bg-slate-900/50 rounded-lg p-1 border border-slate-700 shadow-inner">
                        <button
                            onClick={goPrevProblem}
                            disabled={currentProblemIndex <= 0}
                            className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${currentProblemIndex <= 0 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
                        >
                            <CaretLeft weight="bold" />
                        </button>

                        <div className="flex items-center mx-2 gap-1.5">
                            {problemsList.map((p, idx) => (
                                <button
                                    key={p.id}
                                    onClick={() => navigate(`/code-editor/${p.id}?contestId=${contestId}`)}
                                    // Set focus color on current problem
                                    className={`w-8 h-8 flex items-center justify-center rounded-md font-bold text-sm transition-colors ${idx === currentProblemIndex ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}
                                >
                                    {getLetter(idx)}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={goNextProblem}
                            disabled={currentProblemIndex >= problemsList.length - 1}
                            className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${currentProblemIndex >= problemsList.length - 1 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
                        >
                            <CaretRight weight="bold" />
                        </button>
                    </div>

                    {/* Back to details */}
                    <button
                        onClick={() => navigate(`/contests/${contestId}`)}
                        className="text-sm text-slate-400 hover:text-white transition-colors underline underline-offset-4"
                    >
                        Rời khỏi phòng Code
                    </button>
                </div>
            )}

            <div className="flex-1 w-full relative">
                <Split
                    direction="horizontal"
                    sizes={[40, 60]}
                    minSize={300}
                    gutterSize={6}
                    className="split-horizontal h-full flex"
                >
                    {/* Panel Trái: Problem & Submissions */}
                    <div className="h-full border-r border-slate-800 flex flex-col bg-slate-900">
                        <div className="flex border-b border-slate-700">
                            <button
                                className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'problem' ? 'text-white border-b-2 border-blue-500 bg-slate-800' : 'text-slate-400 hover:text-slate-200'}`}
                                onClick={() => setActiveTab('problem')}
                            >
                                Đề bài
                            </button>
                            <button
                                className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'submissions' ? 'text-white border-b-2 border-blue-500 bg-slate-800' : 'text-slate-400 hover:text-slate-200'}`}
                                onClick={() => setActiveTab('submissions')}
                            >
                                Lịch sử nộp bài
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden relative">
                            {activeTab === 'problem' && (
                                <div className="absolute inset-0">
                                    <ProblemPanel problemId={problemId} contestId={contestId} />
                                </div>
                            )}
                            {activeTab === 'submissions' && (
                                <div className="absolute inset-0">
                                    <SubmissionHistory problemId={problemId} contestId={contestId} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Panel Phải: Editor & Console */}
                    <div className="h-full flex flex-col min-w-0">
                        <Split
                            direction="vertical"
                            sizes={[70, 30]}
                            minSize={100}
                            gutterSize={6}
                            className="split-vertical h-full flex flex-col"
                        >
                            <div className="flex flex-col overflow-hidden bg-slate-900 border border-slate-700/80 rounded-lg">
                                <div className="flex justify-between items-center px-4 py-2 bg-[#f8f9fa] dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm z-20">
                                    {/* Cụm chức năng trái */}
                                    <div className="flex items-center gap-4">

                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-500 dark:text-slate-400 text-sm">Language</span>
                                            <LanguageSelector
                                                language={language}
                                                onChange={changeLanguage}
                                            />
                                        </div>
                                    </div>

                                    {/* Cụm chức năng phải */}
                                    <div className="flex items-center gap-3 relative">
                                        <button
                                            onClick={handleRunCode}
                                            disabled={isSubmitting || isTimeUp}
                                            className={`flex items-center gap-2 px-4 py-1.5 rounded text-sm font-medium transition-colors ${isSubmitting || isTimeUp
                                                ? 'bg-slate-500 text-slate-300 cursor-not-allowed'
                                                : 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600'
                                                }`}
                                        >
                                            <Play size={16} weight="bold" />
                                            {isSubmitting ? 'Đang chạy...' : 'Chạy thử'}
                                        </button>

                                        <button
                                            onClick={handleSubmit}
                                            disabled={isSubmitting || isTimeUp}
                                            className={`flex items-center gap-2 px-4 py-1.5 rounded text-sm font-medium transition-colors ${isSubmitting || isTimeUp
                                                ? 'bg-slate-500 text-slate-300 cursor-not-allowed'
                                                : 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/20'
                                                }`}
                                        >
                                            {isSubmitting ? (
                                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <CheckCircle size={18} weight="fill" />
                                            )}
                                            {isSubmitting ? 'Đang gửi...' : 'Nộp bài'}
                                        </button>

                                        <button
                                            onClick={resetCode}
                                            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors tooltip flex items-center justify-center w-8 h-8 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                                            title="Làm mới code"
                                        >
                                            <ArrowCounterClockwise size={20} weight="bold" />
                                        </button>

                                        <button
                                            id="settings-button"
                                            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                                            className={`transition-colors tooltip flex items-center justify-center w-8 h-8 rounded ${isSettingsOpen ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                                            title="Tùy chọn khác"
                                        >
                                            <DotsThreeVertical size={24} weight="bold" />
                                        </button>

                                        {/* Settings Popover */}
                                        {isSettingsOpen && (
                                            <div className="absolute top-full right-0 z-50 mt-1">
                                                <SettingsPopover
                                                    settings={settings}
                                                    updateSettings={updateSettings}
                                                    onClose={() => setIsSettingsOpen(false)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1 overflow-hidden relative">
                                    <div className="absolute inset-0">
                                        <CodeEditor
                                            language={language}
                                            value={code}
                                            onChange={isTimeUp ? () => { } : setCode}
                                            settings={settings}
                                            readOnly={isTimeUp}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="overflow-hidden bg-slate-900 border border-slate-700/80 rounded-lg relative">
                                <div className="absolute inset-0">
                                    <SampleTestCases testCases={testCases} />
                                </div>
                            </div>
                        </Split>
                    </div>
                </Split>
            </div>
        </div>
    );
}