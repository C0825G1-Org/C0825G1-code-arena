import React from "react";
import { Settings } from "../hooks/useSettings";

type Props = {
    settings: Settings;
    updateSettings: (newSettings: Partial<Settings>) => void;
};

export default function SettingsPopover({ settings, updateSettings }: Props) {
    return (
        <div className="absolute top-full right-0 mt-2 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl p-4 w-[420px] z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Mũi tên trỏ lên (Caret) */}
            <div className="absolute -top-2 right-1.5 w-4 h-4 bg-slate-800 border-l border-t border-slate-600 rotate-45"></div>

            <div className="relative z-10 space-y-4">
                {/* Theme */}
                <div className="flex items-center justify-between">
                    <span className="text-slate-200 text-sm font-medium">Theme</span>
                    <div className="flex bg-slate-900 border border-slate-700 rounded p-0.5">
                        <button
                            className={`px-3 py-1 text-xs font-semibold rounded ${settings.theme === "vs-dark" ? "bg-green-700 text-white" : "text-slate-400 hover:text-slate-200"}`}
                            onClick={() => updateSettings({ theme: "vs-dark" })}
                        >
                            Dark
                        </button>
                        <button
                            className={`px-3 py-1 text-xs font-semibold rounded ${settings.theme === "vs-light" ? "bg-green-700 text-white" : "text-slate-400 hover:text-slate-200"}`}
                            onClick={() => updateSettings({ theme: "vs-light" })}
                        >
                            Light
                        </button>
                        <button
                            className={`px-3 py-1 text-xs font-semibold rounded ${settings.theme === "hc-black" ? "bg-green-700 text-white" : "text-slate-400 hover:text-slate-200"}`}
                            onClick={() => updateSettings({ theme: "hc-black" })}
                        >
                            High Contrast
                        </button>
                    </div>
                </div>

                {/* Editor Mode */}
                <div className="flex items-center justify-between">
                    <span className="text-slate-200 text-sm font-medium">Editor Mode</span>
                    <div className="flex bg-slate-900 border border-slate-700 rounded p-0.5">
                        {["emacs", "normal", "vim"].map(mode => (
                            <button
                                key={mode}
                                className={`px-3 py-1 text-xs font-semibold rounded capitalize ${settings.editorMode === mode ? "bg-green-700 text-white" : "text-slate-400 hover:text-slate-200"}`}
                                onClick={() => updateSettings({ editorMode: mode as any })}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Spaces */}
                <div className="flex items-center justify-between">
                    <span className="text-slate-200 text-sm font-medium">Tab Spaces</span>
                    <div className="flex bg-slate-900 border border-slate-700 rounded p-0.5">
                        {[2, 4, 8].map(spaces => (
                            <button
                                key={spaces}
                                className={`px-3 py-1 text-xs font-semibold rounded ${settings.tabSpaces === spaces ? "bg-green-700 text-white" : "text-slate-400 hover:text-slate-200"}`}
                                onClick={() => updateSettings({ tabSpaces: spaces as any })}
                            >
                                {spaces} spaces
                            </button>
                        ))}
                    </div>
                </div>

                {/* Autocomplete */}
                <div className="flex items-center justify-between">
                    <span className="text-slate-200 text-sm font-medium">Autocomplete <span className="text-slate-500 cursor-help" title="Infor">ⓘ</span></span>
                    <div className="flex bg-slate-900 border border-slate-700 rounded p-0.5">
                        <button
                            className={`px-3 py-1 text-xs font-semibold rounded ${settings.autoComplete ? "bg-green-700 text-white" : "text-slate-400 hover:text-slate-200"}`}
                            onClick={() => updateSettings({ autoComplete: true })}
                        >
                            Enable
                        </button>
                        <button
                            className={`px-3 py-1 text-xs font-semibold rounded ${!settings.autoComplete ? "bg-green-700 text-white" : "text-slate-400 hover:text-slate-200"}`}
                            onClick={() => updateSettings({ autoComplete: false })}
                        >
                            Disable
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
