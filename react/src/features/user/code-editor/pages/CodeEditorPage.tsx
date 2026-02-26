import CodeEditor from "../components/CodeEditor";
import ProblemPanel from "../components/ProblemPanel";
import LanguageSelector from "../components/LanguageSelector";
import Split from "react-split";
import SampleTestCases from "../components/SampleTestCases";
import { useEffect, useState } from "react";
import { getSampleTestCases, TestCase } from "../services/problemService";
import { useSettings } from "../hooks/useSettings";
import SettingsPopover from "../components/SettingsPopover";
import { useArena } from "../hooks/useArena";
import { ArrowCounterClockwise, DotsThreeVertical } from "@phosphor-icons/react";

export default function Home() {
    const { language, code, setCode, changeLanguage, resetCode } = useArena(1);
    const { settings, updateSettings } = useSettings();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [testCases, setTestCases] = useState<TestCase[]>([]);

    useEffect(() => {
        // Mock get sample test cases for problem 1
        getSampleTestCases(1).then(setTestCases).catch(console.error);
    }, []);

    return (
        <div className="h-screen bg-slate-900 text-slate-300 overflow-hidden">
            <Split
                direction="horizontal"
                sizes={[40, 60]}
                minSize={300}
                gutterSize={6}
                className="split-horizontal h-full flex"
            >
                {/* Panel Trái: Problem */}
                <div className="h-full border-r border-slate-800 overflow-auto">
                    <ProblemPanel problemId={1} />
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
                                        onClick={resetCode}
                                        className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors tooltip flex items-center justify-center w-8 h-8 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                                        title="Làm mới code"
                                    >
                                        <ArrowCounterClockwise size={20} weight="bold" />
                                    </button>
                                    {/* Xoá Fullscreen (ArrowsOut) theo yêu cầu */}

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