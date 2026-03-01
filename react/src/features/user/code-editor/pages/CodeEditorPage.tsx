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
    const [activeTab, setActiveTab] = useState<'problem' | 'submissions' | 'hints' | 'discussions'>('problem');

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
        <div className={`h-screen bg-[#0f172a] text-slate-300 flex flex-col overflow-hidden font-sans relative ${isExamMode ? 'border-4 border-red-500/30' : ''}`}>
            {/* Focus Mode Ambient Glow */}
            {isExamMode && <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(239,68,68,0.15)] z-0"></div>}

            {/* Submitting Overlay */}
            {isSubmitting && (
                <div className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center">
                    <div className="bg-[#1e293b] p-8 rounded-2xl border border-white/10 shadow-2xl flex flex-col items-center max-w-sm w-full mx-4 relative overflow-hidden">
                        {/* Biểu tượng Loading */}
                        <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
                            <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-2xl animate-pulse">🚀</span>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2 text-center">Đang gửi bài nộp</h3>
                        <p className="text-slate-400 text-sm text-center mb-6">Mã nguồn của bạn đang được biên dịch và chạy trên hệ thống máy chấm (Docker Engine).</p>

                        {/* Thanh progress tự giả lập */}
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full animate-[progress_2s_ease-in-out_infinite]" style={{ width: '60%' }}></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Navigation Bar - Premium Style */}
            <header className="h-14 bg-[#0f172a] border-b border-white/5 flex items-center justify-between px-6 shrink-0 z-50">
                {/* Left: Breadcrumb & Mode Indicator */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
                        <span className="hover:text-white cursor-pointer transition-colors" onClick={() => navigate('/')}>Home</span>
                        <span className="text-slate-600">/</span>
                        <span className="hover:text-white cursor-pointer transition-colors" onClick={() => navigate(isExamMode ? `/contests/${contestId}` : '/problems')}>
                            {isExamMode ? 'Contests' : 'Problems'}
                        </span>
                        <span className="text-slate-600">/</span>
                        <span className="text-slate-200">Problem {problemId}</span>
                    </div>
                    {isExamMode ? (
                        <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 rounded-full flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            Exam Mode
                        </span>
                    ) : (
                        <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Practice
                        </span>
                    )}
                </div>

                {/* Middle: Title or Contest Time */}
                <div className="flex items-center justify-center flex-1">
                    {isExamMode && contest?.endTime && (
                        <div className="flex items-center gap-3 bg-[#1e293b] px-4 py-1.5 rounded-full border border-white/5 shadow-inner">
                            <ListBullets weight="bold" className="text-blue-400" />
                            <span className="text-slate-200 font-semibold truncate max-w-[200px]">{contest?.title}</span>
                            <div className="w-px h-4 bg-slate-700 mx-2"></div>
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

                {/* Right: Actions */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(isExamMode ? `/contests/${contestId}` : '/problems')}
                        className="text-sm font-medium px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all duration-200"
                    >
                        Thoát
                    </button>
                </div>
            </header>

            {/* Problem Switcher Strip (if Exam Mode) */}
            {isExamMode && problemsList.length > 0 && (
                <div className="h-10 bg-[#0f172a] border-b border-white/5 flex items-center justify-center shrink-0 shadow-sm z-40">
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={goPrevProblem}
                            disabled={currentProblemIndex <= 0}
                            className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${currentProblemIndex <= 0 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                        >
                            <CaretLeft weight="bold" />
                        </button>
                        {problemsList.map((p, idx) => (
                            <button
                                key={p.id}
                                onClick={() => navigate(`/code-editor/${p.id}?contestId=${contestId}`)}
                                className={`w-8 h-8 flex items-center justify-center rounded font-semibold text-sm transition-all duration-200 ${idx === currentProblemIndex ? 'bg-blue-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.6)] scale-110' : 'bg-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                            >
                                {getLetter(idx)}
                            </button>
                        ))}
                        <button
                            onClick={goNextProblem}
                            disabled={currentProblemIndex >= problemsList.length - 1}
                            className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${currentProblemIndex >= problemsList.length - 1 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                        >
                            <CaretRight weight="bold" />
                        </button>
                    </div>
                </div>
            )}

            <div className="flex-1 w-full relative bg-[#0f172a] p-2">
                <Split
                    direction="horizontal"
                    sizes={[40, 60]}
                    minSize={300}
                    gutterSize={8}
                    className="split-horizontal h-full flex"
                >
                    {/* Panel Trái: Problem & Submissions */}
                    <div className="h-full flex flex-col bg-[#1e293b] rounded-xl overflow-hidden border border-white/5 shadow-2xl">
                        {/* Tabs */}
                        <div className="flex border-b border-white/5 bg-[#0f172a]/50 p-1 gap-1 flex-wrap">
                            <button
                                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 min-w-[100px] ${activeTab === 'problem' ? 'bg-[#1e293b] text-white shadow-sm border border-white/5' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'}`}
                                onClick={() => setActiveTab('problem')}
                            >
                                Đề bài
                            </button>
                            <button
                                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 min-w-[100px] ${activeTab === 'submissions' ? 'bg-[#1e293b] text-white shadow-sm border border-white/5' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'}`}
                                onClick={() => setActiveTab('submissions')}
                            >
                                Báo cáo nộp bài
                            </button>
                            {!isExamMode && (
                                <>
                                    <button
                                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 min-w-[100px] ${activeTab === 'hints' ? 'bg-[#1e293b] text-white shadow-sm border border-white/5' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'}`}
                                        onClick={() => setActiveTab('hints')}
                                    >
                                        Gợi ý
                                    </button>
                                    <button
                                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 min-w-[100px] ${activeTab === 'discussions' ? 'bg-[#1e293b] text-white shadow-sm border border-white/5' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'}`}
                                        onClick={() => setActiveTab('discussions')}
                                    >
                                        Thảo luận
                                    </button>
                                </>
                            )}
                        </div>
                        <div className="flex-1 overflow-hidden relative bg-[#0f172a]/20">
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
                            {activeTab === 'hints' && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-slate-400">
                                    <span className="text-4xl mb-4">💡</span>
                                    <h4 className="text-lg font-bold text-white mb-2">Gợi ý & Hướng dẫn</h4>
                                    <p className="text-center max-w-sm">Trong chế độ luyện tập, bạn có thể xem các gợi ý tiếp cận bài toán.</p>
                                    <button className="mt-4 px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/20 font-medium hover:bg-blue-600/30 transition-colors">Mở khóa gợi ý</button>
                                </div>
                            )}
                            {activeTab === 'discussions' && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-slate-400">
                                    <span className="text-4xl mb-4">💬</span>
                                    <h4 className="text-lg font-bold text-white mb-2">Cộng đồng Thảo luận</h4>
                                    <p className="text-center max-w-sm">Tham gia thảo luận, chia sẻ các thuật toán tối ưu với các người chơi khác.</p>
                                    <span className="mt-4 px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-xs font-bold uppercase tracking-widest text-slate-300">Coming Soon</span>
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Panel Phải: Editor & Console */}
                    <div className="h-full flex flex-col min-w-0 bg-transparent rounded-xl overflow-hidden">
                        <Split
                            direction="vertical"
                            sizes={[70, 30]}
                            minSize={100}
                            gutterSize={8}
                            className="split-vertical h-full flex flex-col"
                        >
                            <div className="flex flex-col overflow-hidden bg-[#1e293b] border border-white/5 shadow-2xl relative rounded-xl">
                                <div className="flex justify-between items-center px-4 py-2 bg-[#0f172a]/80 backdrop-blur border-b border-white/5 z-20">
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
                            <div className="overflow-hidden bg-[#1e293b] border border-white/5 shadow-2xl relative rounded-xl">
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