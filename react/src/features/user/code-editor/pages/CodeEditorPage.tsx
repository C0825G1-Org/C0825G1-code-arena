import { useParams, useSearchParams } from "react-router-dom";
import CodeEditor from "../components/CodeEditor";
import ProblemPanel from "../components/ProblemPanel";
import LanguageSelector from "../components/LanguageSelector";
import Split from "react-split";
import SampleTestCases from "../components/SampleTestCases";
import SubmissionHistory from "../components/SubmissionHistory";
import { useEffect, useState } from "react";
import { getSampleTestCases, TestCase } from "../services/problemService";
import { useSettings } from "../hooks/useSettings";
import SettingsPopover from "../components/SettingsPopover";
import { useArena } from "../hooks/useArena";
import { ArrowCounterClockwise, DotsThreeVertical, Play } from "@phosphor-icons/react";
import axios from "axios";
import { toast } from "react-toastify";

export default function Home() {
    const { problemId: problemIdStr } = useParams<{ problemId: string }>();
    const problemId = problemIdStr ? parseInt(problemIdStr, 10) : 1; // Fallback to 1 if no param
    const { language, code, setCode, changeLanguage, resetCode } = useArena(problemId);
    const { settings, updateSettings } = useSettings();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [testCases, setTestCases] = useState<TestCase[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'problem' | 'submissions'>('problem');

    const [searchParams] = useSearchParams();
    const contestId = searchParams.get('contestId');
    const isExamMode = !!contestId;

    useEffect(() => {
        // Mock get sample test cases for problem 1
        getSampleTestCases(problemId).then(setTestCases).catch(console.error);

        // Anti-cheat mechanisms
        if (isExamMode) {
            const handleVisibilityChange = () => {
                if (document.hidden) {
                    toast.error("CẢNH BÁO: BẠN VỪA RỜI KHỎI MÀN HÌNH THI!", {
                        position: "top-center",
                        autoClose: false,
                        style: { fontWeight: 'bold', fontSize: '1.2rem', padding: '1rem' }
                    });
                    // Todo: Call API to log warning for user
                }
            };

            const handlePreventCopyPaste = (e: ClipboardEvent) => {
                e.preventDefault();
                toast.warning("Hành động bị cấm trong kỳ thi!");
            };

            const handleContextMenu = (e: MouseEvent) => {
                e.preventDefault();
            };

            document.addEventListener('visibilitychange', handleVisibilityChange);
            document.addEventListener('copy', handlePreventCopyPaste);
            document.addEventListener('paste', handlePreventCopyPaste);
            document.addEventListener('contextmenu', handleContextMenu);

            return () => {
                document.removeEventListener('visibilitychange', handleVisibilityChange);
                document.removeEventListener('copy', handlePreventCopyPaste);
                document.removeEventListener('paste', handlePreventCopyPaste);
                document.removeEventListener('contextmenu', handleContextMenu);
            };
        }
    }, [isExamMode, problemId]);

    const handleSubmit = async () => {
        if (!code.trim()) {
            toast.warning("Mã nguồn không được để trống!");
            return;
        }

        // Map language string to language_id (Assuming: 1=Java, 2=Python, 3=C++)
        let langId = 1;
        if (language === 'python') langId = 2;
        if (language === 'cpp') langId = 3;

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token'); // Lấy token thật từ Dev 1 nếu có

            const response = await axios.post('http://localhost:8080/api/submissions', {
                problemId: problemId,
                languageId: langId,
                sourceCode: code,
                ...(isExamMode ? { contestId: parseInt(contestId) } : {})
            }, {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            });

            if (response.status === 200) {
                toast.success("Đã nộp bài, đang chờ hệ thống chấm...");
                setActiveTab('submissions');
            }
        } catch (error) {
            console.error("Lỗi khi nộp bài:", error);
            toast.error("Có lỗi xảy ra khi nộp bài. Vui lòng thử lại!");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="h-screen bg-slate-900 text-slate-300 overflow-hidden">
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
                    <div className="flex-1 overflow-hidden">
                        {activeTab === 'problem' && <ProblemPanel problemId={problemId} contestId={contestId} />}
                        {activeTab === 'submissions' && <SubmissionHistory problemId={problemId} contestId={contestId} />}
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
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className={`flex items-center gap-2 px-4 py-1.5 rounded text-sm font-medium transition-colors ${isSubmitting
                                            ? 'bg-slate-500 text-slate-300 cursor-not-allowed'
                                            : 'bg-green-600 hover:bg-green-700 text-white'
                                            }`}
                                    >
                                        {isSubmitting ? (
                                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <Play size={16} weight="fill" />
                                        )}
                                        {isSubmitting ? 'Đang gửi...' : 'Nộp Code'}
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
                            <div className="flex-1 overflow-hidden">
                                <CodeEditor
                                    language={language}
                                    value={code}
                                    onChange={setCode}
                                    settings={settings}
                                />
                            </div>
                        </div>
                        <div className="overflow-hidden bg-slate-900 border border-slate-700/80 rounded-lg">
                            <SampleTestCases testCases={testCases} />
                        </div>
                    </Split>
                </div>
            </Split>
        </div>
    );
}