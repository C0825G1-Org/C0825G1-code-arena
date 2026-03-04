import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import Split from "react-split";
import { toast } from "react-toastify";
import Joyride, { Step, CallBackProps, EVENTS } from 'react-joyride';

import CodeEditor from "../components/CodeEditor";
import { EditorHeader } from '../components/EditorHeader';
import { ProblemStrip } from '../components/ProblemStrip';
import { ActionToolbar } from '../components/ActionToolbar';
import { useSettings } from "../hooks/useSettings";
import { Language } from "../hooks/useArena";

export default function TutorialEditorPage() {
    const navigate = useNavigate();
    const { settings, updateSettings } = useSettings();

    const [language, setLanguage] = useState<Language>('java');
    const [code, setCode] = useState("public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello CodeArena!\");\n    }\n}");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'problem' | 'submissions'>('problem');
    const [testPanelTab, setTestPanelTab] = useState<'testcases' | 'result'>('testcases');
    const [hasRun, setHasRun] = useState(false);
    const [runTour, setRunTour] = useState(true);

    // Static Mock Data
    const mockProblems = [
        { id: 1, title: 'Bài A: Tính tổng mảng 1 chiều', timeLimit: 1000, memoryLimit: 256, orderIndex: 1 },
        { id: 2, title: 'Bài B: Kiểm tra mảng Đối Xứng', timeLimit: 2000, memoryLimit: 512, orderIndex: 2 }
    ];
    const mockTestCases = [
        { id: 1, inputData: '5\n1 2 3 4 5', expectedOutput: '15' },
        { id: 2, inputData: '3\n-1 0 1', expectedOutput: '0' },
        { id: 3, inputData: '4\n10 20 30 40', expectedOutput: '100', isHidden: true }
    ];
    const problemStatus = { 1: { submitCount: 0, isAC: false } };

    const tutorialSteps: Step[] = [
        {
            target: 'body',
            content: (
                <div className="text-left space-y-2">
                    <h3 className="text-lg font-bold text-blue-500">🎉 Chào mừng đến với CodeArena!</h3>
                    <p className="text-slate-700 text-sm leading-relaxed">Đây là <strong>Phòng Thi Giả Lập</strong> - Nơi bạn có thể làm quen với toàn bộ tính năng và giao diện thi đấu thực tế một cách an toàn nhất.</p>
                    <p className="text-slate-700 text-sm leading-relaxed italic">Dữ liệu ở đây hoàn toàn là mô phỏng, bạn cứ thoải mái bấm thử mọi thứ mà không lo ảnh hưởng đến điểm số nhé! Cùng bắt đầu nào!</p>
                </div>
            ),
            placement: 'center',
            disableBeacon: true,
        },
        {
            target: '.tour-contest-timer',
            content: (
                <div className="text-left space-y-1">
                    <h4 className="font-bold text-blue-500">⏱️ Đồng hồ đếm ngược</h4>
                    <p className="text-sm text-slate-700">Hiển thị Thời gian còn lại và Tên kỳ thi. Khi vào thi đếm ngược về 0, hệ thống sẽ tự động thu bài của bạn.</p>
                </div>
            ),
        },
        {
            target: '.tour-exit-btn',
            content: (
                <div className="text-left space-y-1">
                    <h4 className="font-bold text-red-500">🚪 Khóa / Thoát kỳ thi</h4>
                    <p className="text-sm text-slate-700">Sau khi đã hoàn thành hoặc muốn dừng làm bài, bạn có thể nhấn vào đây để nộp toàn bộ các câu, kết thúc bài thi và quay về trang chủ cuộc thi.</p>
                </div>
            ),
        },
        {
            target: '.tour-problem-strip',
            content: (
                <div className="text-left space-y-1">
                    <h4 className="font-bold text-blue-500">📚 Danh sách Câu hỏi</h4>
                    <p className="text-sm text-slate-700">Đề thi thường có nhiều câu (1, 2, 3...). Bấm vào các con số để chuyển đề. Màu sắc sẽ thay đổi khi bạn nộp đúng (Xanh) hoặc sai (Cam).</p>
                </div>
            ),
        },
        {
            target: '.tour-tab-problem',
            content: (
                <div className="text-left space-y-1">
                    <h4 className="font-bold text-blue-500">📖 Đề Bài & Dữ liệu</h4>
                    <p className="text-sm text-slate-700">Khu vực hiển thị giới hạn Bộ nhớ (Memory) / Thời gian (Time), yêu cầu của bài toán và các quy tắc Input/Output.</p>
                </div>
            ),
        },
        {
            target: '.tour-tab-submissions',
            content: (
                <div className="text-left space-y-1">
                    <h4 className="font-bold text-blue-500">📊 Lịch sử Nộp bài</h4>
                    <p className="text-sm text-slate-700">Chuyển sang tab này để xem điểm số chi tiết từng lần nộp, báo cáo lỗi Biên dịch hoặc TLE/WA của thuật toán.</p>
                </div>
            ),
        },
        {
            target: '.tour-testcases-panel',
            content: (
                <div className="text-left space-y-1">
                    <h4 className="font-bold text-emerald-500">🧪 Bộ Test Cases Mẫu</h4>
                    <p className="text-sm text-slate-700">Những Ví dụ cụ thể minh họa cho Đề bài. Bạn có thể tự mình test thử code xem có ra đúng <span className="font-bold">Expected Output</span> không trước khi nộp thật.</p>
                </div>
            ),
        },
        {
            target: '.tour-language-selector',
            content: (
                <div className="text-left space-y-1">
                    <h4 className="font-bold text-blue-500">🔤 Chọn Ngôn ngữ</h4>
                    <p className="text-sm text-slate-700">Hỗ trợ C++, Java, Python, JavaScript. Hãy chọn vũ khí sở trường của bạn!</p>
                </div>
            ),
        },
        {
            target: '.tour-settings-btn',
            content: (
                <div className="text-left space-y-1">
                    <h4 className="font-bold text-blue-500">⚙️ Tùy chỉnh Giao diện</h4>
                    <p className="text-sm text-slate-700">Thay đổi Font chữ to nhỏ, giao diện Sáng/Tối cho Editor, bật tắt Autocomplete,... cho vừa mắt.</p>
                </div>
            ),
        },
        {
            target: '.tour-reset-btn',
            content: (
                <div className="text-left space-y-1">
                    <h4 className="font-bold text-blue-500">🔄 Khôi phục Code mãu</h4>
                    <p className="text-sm text-slate-700">Nếu code bị quá nát, nút này sẽ đưa Trình soạn thảo về đoạn code đúc sẵn do giáo viên cung cấp ban đầu.</p>
                </div>
            ),
        },
        {
            target: '.tour-code-editor',
            content: (
                <div className="text-left space-y-2">
                    <h4 className="font-bold text-blue-500">💻 Khu vực Viết Code</h4>
                    <p className="text-sm text-slate-700">Sân khấu chính là đây! Khung soạn thảo mạnh mẽ, tự động tô màu cú pháp.</p>
                </div>
            ),
        },
        {
            target: '.tour-run-btn',
            content: (
                <div className="text-left space-y-1">
                    <h4 className="font-bold text-slate-600">▶️ Chạy Thử (Run)</h4>
                    <p className="text-sm text-slate-700">Biên dịch code và chạy đối chiếu kết quả với các <span className="font-bold">Test Cases Mẫu</span> ở khung phía dưới. <strong>KHÔNG</strong> lấy điểm vào hệ thống.</p>
                </div>
            ),
        },
        {
            target: '.tour-submit-btn',
            content: (
                <div className="text-left space-y-2">
                    <h4 className="font-bold text-emerald-600">🚀 Nộp bài Dứt điểm (Submit)</h4>
                    <p className="text-sm text-slate-700">Mang bài của bạn đưa vào đánh giá bằng các <strong>Hidden Test Cases</strong> khó nhằn. Kết quả sẽ được ghi vô Bảng xếp hạng.</p>
                    <p className="text-sm text-emerald-600 font-bold mt-2">Đó là toàn bộ hướng dẫn. Chúc bạn thi tốt! 🎉</p>
                </div>
            ),
        }
    ];

    const handleSubmitMock = (isRunOnly: boolean) => {
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
            if (isRunOnly) {
                setHasRun(true);
                setTestPanelTab('result');
                toast.success('Chạy thử mẫu (Giả lập) hoàn tất!');
            } else {
                toast.success('Nộp bài thành công (Giả lập)! Đây chỉ là bản thử nghiệm.');
                setActiveTab('submissions');
            }
        }, 1500);
    };

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { index, type, status } = data;

        if (status === 'finished' || status === 'skipped') {
            setRunTour(false);
        }

        if (type === EVENTS.STEP_BEFORE || type === EVENTS.TOOLTIP) {
            // Khi sang bước 5 (Tab Đề Bài)
            if (index === 4) {
                setActiveTab('problem');
            }
            // Khi sang bước 6 (Tab Báo cáo nộp bài)
            else if (index === 5) {
                setActiveTab('submissions');
            }
            // Khi sang bước 7 (Test Cases Panel) hoặc 12 (Nút Run)
            else if (index === 6 || index === 11) {
                setTestPanelTab('testcases');
            }
            // Khi sang bước 13 (Nút Submit)
            else if (index === 12) {
                setActiveTab('submissions');
            }
        }
    };

    return (
        <div className={`h-screen bg-[#0f172a] text-slate-300 flex flex-col overflow-hidden font-sans relative border-4 border-blue-500/30`}>
            {/* Background effects */}
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(59,130,246,0.15)] z-0"></div>

            <Joyride
                steps={tutorialSteps}
                continuous
                showProgress
                showSkipButton
                callback={handleJoyrideCallback}
                disableScrolling={true}
                disableScrollParentFix={true}
                run={runTour}
                styles={{
                    options: {
                        primaryColor: '#3b82f6',
                        zIndex: 1000,
                    }
                }}
                locale={{ next: 'Tiếp', back: 'Quay lại', skip: 'Bỏ qua', last: 'Hoàn tất' }}
            />

            {isSubmitting && (
                <div className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center">
                    <div className="bg-[#1e293b] p-8 rounded-2xl border border-white/10 shadow-2xl flex flex-col items-center max-w-sm w-full mx-4">
                        <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
                            <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-2xl animate-pulse">🚀</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 text-center">Giao tiếp Server...</h3>
                        <p className="text-slate-400 text-sm text-center mb-6">Đang mô phỏng thao tác gửi mã nguồn lên hệ thống chấm.</p>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full animate-[progress_1s_ease-in-out_infinite]" style={{ width: '40%' }}></div>
                        </div>
                    </div>
                </div>
            )}

            <EditorHeader
                isExamMode={true}
                contestId="tutorial"
                problemId={1}
                isCapturing={false}
                contestTitle="Kỳ thi Giả lập (Onboarding)"
                contestEndTime={new Date(Date.now() + 3600 * 1000).toISOString()}
                isTimeUp={false}
                onTimeUp={() => { }}
                onManualExit={() => navigate(-1)}
            />

            <ProblemStrip
                problemsList={mockProblems}
                currentProblemIndex={0}
                problemStatus={problemStatus}
                onGoPrev={() => { }}
                onGoNext={() => { }}
                onSelectProblem={() => { }}
            />

            <div className="flex-1 w-full relative bg-[#0f172a] p-2">
                <Split direction="horizontal" sizes={[40, 60]} minSize={300} gutterSize={8} className="split-horizontal h-full flex">
                    {/* Panel Trái */}
                    <div className="h-full flex flex-col bg-[#1e293b] rounded-xl overflow-hidden border border-white/5 shadow-2xl tour-problem-panel">
                        <div className="flex border-b border-white/5 bg-[#0f172a]/50 p-1 gap-1 flex-wrap">
                            <button className={`tour-tab-problem flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 min-w-[100px] ${activeTab === 'problem' ? 'bg-[#1e293b] text-white shadow-sm border border-white/5' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'}`} onClick={() => setActiveTab('problem')}>Đề bài</button>
                            <button className={`tour-tab-submissions flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 min-w-[100px] ${activeTab === 'submissions' ? 'bg-[#1e293b] text-white shadow-sm border border-white/5' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'}`} onClick={() => setActiveTab('submissions')}>Báo cáo nộp bài</button>
                        </div>
                        <div className="flex-1 overflow-hidden relative bg-[#0f172a]/20 tour-problem-panel">
                            <div className="absolute inset-0 overflow-y-auto overflow-x-hidden p-6 custom-scrollbar max-w-none">
                                {activeTab === 'problem' && (
                                    <div className="prose prose-invert max-w-none">
                                        <h2 className="text-2xl font-bold text-white mb-4 shadow-[0_4px_10px_rgba(0,0,0,0.5)] bg-[#1e293b] p-4 rounded-xl border border-white/5">Bài A: Tính tổng mảng 1 chiều (Giả lập)</h2>
                                        <div className="flex gap-4 mb-6 text-sm text-slate-400">
                                            <div className="bg-slate-800 px-3 py-1 rounded shadow-inner flex items-center gap-2"><span>⏱️</span> Time Limit: 1000ms</div>
                                            <div className="bg-slate-800 px-3 py-1 rounded shadow-inner flex items-center gap-2"><span>💾</span> Memory Limit: 256MB</div>
                                        </div>
                                        <div className="bg-blue-500/10 border-l-4 border-blue-500 p-4 rounded-r-lg mb-6">
                                            <p className="text-blue-100 font-medium m-0">Cho một mảng số nguyên A gồm N phần tử. Yêu cầu tính tổng tất cả các phần tử trong mảng đó.</p>
                                        </div>

                                        <h3 className="text-lg text-emerald-400 mt-6 mb-2 font-bold border-b border-emerald-500/30 pb-2">Dữ liệu vào (Input):</h3>
                                        <ul className="text-slate-300 list-disc pl-5 marker:text-emerald-500">
                                            <li>Dòng đầu tiên chứa một số nguyên dương <strong>N</strong> (1 ≤ N ≤ 10^5) là số lượng phần tử của mảng.</li>
                                            <li>Dòng thứ hai chứa N số nguyên A[1], A[2], ..., A[N] (-10^9 ≤ A[i] ≤ 10^9), mỗi số cách nhau bởi một khoảng trắng.</li>
                                        </ul>

                                        <h3 className="text-lg text-purple-400 mt-6 mb-2 font-bold border-b border-purple-500/30 pb-2">Dữ liệu ra (Output):</h3>
                                        <p className="text-slate-300">In ra một số nguyên duy nhất là tổng tất cả các phần tử trong mảng.</p>

                                        <div className="mt-8 flex gap-4">
                                            <div className="flex-1">
                                                <h4 className="text-sm text-slate-400 mb-2 font-bold uppercase tracking-widest pl-2 border-l-2 border-slate-600">Ví dụ Input</h4>
                                                <pre className="bg-black/40 p-4 rounded-xl border border-white/10 text-slate-300 shadow-inner font-mono text-sm">
                                                    5<br />
                                                    1 2 3 4 5
                                                </pre>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm text-slate-400 mb-2 font-bold uppercase tracking-widest pl-2 border-l-2 border-slate-600">Ví dụ Output</h4>
                                                <pre className="bg-black/40 p-4 rounded-xl border border-white/10 text-emerald-400 shadow-inner font-mono text-sm font-bold">
                                                    15
                                                </pre>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {activeTab === 'submissions' && (
                                    <div className="mt-2 flex flex-col gap-3">
                                        <h3 className="text-lg font-bold text-white mb-2 shadow-[0_4px_10px_rgba(0,0,0,0.5)] bg-[#1e293b] p-4 rounded-xl border border-white/5 flex items-center gap-2">
                                            <span>📋</span> Lịch sử nộp bài (Giả lập)
                                        </h3>

                                        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex flex-col md:flex-row md:items-center justify-between gap-2 shadow-lg hover:bg-emerald-500/20 transition-all cursor-pointer">
                                            <div>
                                                <span className="text-emerald-400 font-bold bg-emerald-500/20 px-2 py-1 rounded">Accepted</span>
                                                <span className="text-slate-400 text-sm ml-3">Vừa xong</span>
                                            </div>
                                            <div className="flex gap-4 text-sm text-slate-300 font-mono">
                                                <span className="flex items-center gap-1">⏱️ 142ms</span>
                                                <span className="flex items-center gap-1">💾 33.5MB</span>
                                                <span className="text-emerald-400 font-bold ml-2 hidden md:block">100 ĐIỂM</span>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-xl border border-orange-500/30 bg-orange-500/10 flex flex-col md:flex-row md:items-center justify-between gap-2 shadow-lg opacity-80 cursor-pointer">
                                            <div>
                                                <span className="text-orange-400 font-bold bg-orange-500/20 px-2 py-1 rounded">Wrong Answer</span>
                                                <span className="text-slate-400 text-sm ml-3">2 phút trước</span>
                                            </div>
                                            <div className="flex gap-4 text-sm text-slate-300 font-mono">
                                                <span className="flex items-center gap-1">⏱️ 120ms</span>
                                                <span className="flex items-center gap-1">💾 32.1MB</span>
                                                <span className="text-orange-400 font-bold ml-2 hidden md:block">40 ĐIỂM</span>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex flex-col md:flex-row md:items-center justify-between gap-2 shadow-lg opacity-70 cursor-pointer">
                                            <div>
                                                <span className="text-red-400 font-bold bg-red-500/20 px-2 py-1 rounded">Compilation Error</span>
                                                <span className="text-slate-400 text-sm ml-3">5 phút trước</span>
                                            </div>
                                            <div className="flex gap-4 text-sm text-slate-300 font-mono">
                                                <span className="flex items-center gap-1">⏱️ --</span>
                                                <span className="flex items-center gap-1">💾 --</span>
                                                <span className="text-red-400 font-bold ml-2 hidden md:block">0 ĐIỂM</span>
                                            </div>
                                        </div>

                                        <div className="mt-4 p-4 text-center bg-[#0f172a]/50 border border-dashed border-slate-700/50 rounded-xl">
                                            <p className="text-slate-500 text-sm italic">Vì đây là môi trường Giả lập, bảng mô phỏng lịch sử mang tính chất minh họa thao tác.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Panel Phải */}
                    <div className="h-full flex flex-col min-w-0 bg-transparent rounded-xl overflow-hidden">
                        <Split direction="vertical" sizes={[70, 30]} minSize={100} gutterSize={8} className="split-vertical h-full flex flex-col">
                            <div className="flex flex-col overflow-hidden bg-[#1e293b] border border-white/5 shadow-2xl relative rounded-xl">
                                <ActionToolbar
                                    language={language}
                                    onChangeLanguage={setLanguage}
                                    isSubmitting={isSubmitting}
                                    isTimeUp={false}
                                    isExamMode={true}
                                    participantStatus="JOINED"
                                    submitCount={0}
                                    isAC={false}
                                    onRunCode={() => handleSubmitMock(true)}
                                    onSubmit={() => handleSubmitMock(false)}
                                    onResetCode={() => setCode("")}
                                    isSettingsOpen={isSettingsOpen}
                                    onToggleSettings={setIsSettingsOpen}
                                    settings={settings}
                                    onUpdateSettings={updateSettings}
                                />
                                <div className="tour-code-editor flex-1 overflow-hidden relative">
                                    <CodeEditor
                                        language={language}
                                        value={code}
                                        onChange={setCode}
                                        settings={settings}
                                        readOnly={false}
                                    />
                                </div>
                            </div>

                            {/* Panel Test Cases (Nửa dưới bên phải) */}
                            <div className="flex flex-col overflow-hidden bg-[#1e293b] border border-white/5 shadow-2xl relative rounded-xl ml-2 md:ml-0 mt-2 md:mt-0">
                                <div className="tour-testcases-panel flex border-b border-white/5 bg-[#0f172a]/50 p-2 gap-2">
                                    <div className="px-4 py-1.5 rounded-lg text-sm font-medium bg-[#1e293b] text-white shadow-sm border border-white/5 flex items-center gap-2">
                                        Test Cases
                                    </div>
                                    {testPanelTab === 'result' && (
                                        <div className="px-4 py-1.5 rounded-lg text-sm font-medium bg-emerald-500/20 text-emerald-400 shadow-sm border border-white/5 flex items-center gap-2">
                                            Kết quả: {hasRun ? 'Passed 2/2' : 'Đang xử lý...'}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 overflow-hidden relative">
                                    <div className="absolute inset-0 p-2 md:p-4 overflow-y-auto custom-scrollbar">
                                        {testPanelTab === 'testcases' ? (
                                            <div className="flex flex-wrap gap-2 md:gap-4">
                                                {mockTestCases.map((tc, idx) => (
                                                    <div key={tc.id} className={`w-full md:flex-1 min-w-[200px] bg-[#0f172a]/30 rounded-xl p-3 md:p-4 border transition-all font-mono text-xs md:text-sm ${tc.isHidden ? 'border-slate-700/50 grayscale opacity-80' : 'border-white/5 hover:border-blue-500/20'}`}>
                                                        <div className="mb-2 flex justify-between items-center text-slate-500 font-bold uppercase tracking-wider text-[10px] md:text-xs">
                                                            <span>Case {idx + 1}</span>
                                                            {tc.isHidden && <span className="text-[10px] text-slate-500 flex items-center gap-1">🔒 Hidden</span>}
                                                        </div>
                                                        <div className="mb-2 md:mb-3">
                                                            <div className="text-slate-400 mb-1 text-[10px] md:text-xs">Input:</div>
                                                            <div className={`bg-[#0f172a] text-slate-300 p-2 md:p-3 rounded border overflow-x-auto ${tc.isHidden ? 'border-transparent text-slate-600' : 'border-white/5'}`}>
                                                                {tc.isHidden ? '••••••••••••' : tc.inputData}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-slate-400 mb-1 text-[10px] md:text-xs">Expected:</div>
                                                            <div className={`bg-[#0f172a] text-emerald-400 p-2 md:p-3 rounded border overflow-x-auto ${tc.isHidden ? 'border-transparent text-slate-600' : 'border-white/5'}`}>
                                                                {tc.isHidden ? '••••••••••••' : tc.expectedOutput}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-4">
                                                {hasRun ? (
                                                    <div className="space-y-4 animate-in fade-in duration-500">
                                                        <div className="flex flex-wrap gap-2 md:gap-4">
                                                            {mockTestCases.filter(tc => !tc.isHidden).map((tc, idx) => (
                                                                <div key={tc.id} className="w-full md:flex-1 min-w-[200px] bg-[#0f172a]/80 shadow-lg rounded-xl p-3 md:p-4 border border-emerald-500/30 transition-all font-mono text-xs md:text-sm">
                                                                    <div className="mb-2 flex justify-between items-center text-slate-500 font-bold uppercase tracking-wider text-[10px] md:text-xs">
                                                                        <span className="text-slate-300">Case {idx + 1}</span>
                                                                        <span className="text-emerald-400 px-2 py-0.5 bg-emerald-500/20 rounded">Passed</span>
                                                                    </div>
                                                                    <div className="mb-2 md:mb-3">
                                                                        <div className="text-slate-400 mb-1 text-[10px] md:text-xs">Input:</div>
                                                                        <div className="bg-[#0f172a] text-slate-300 p-2 md:p-3 rounded border border-white/5 overflow-x-auto">{tc.inputData}</div>
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-slate-400 mb-1 text-[10px] md:text-xs">Your Output:</div>
                                                                        <div className="bg-[#0f172a] text-emerald-400 p-2 md:p-3 rounded border border-white/5 overflow-x-auto font-bold">{tc.expectedOutput}</div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="h-full flex items-center justify-center text-slate-500 italic text-sm py-10">
                                                        Đang xử lý...
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Split>
                    </div>
                </Split>
            </div>
        </div>
    );
}
