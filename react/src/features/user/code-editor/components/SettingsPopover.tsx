import React, { useEffect, useRef } from "react";
import { Settings, Theme, EditorMode } from "../hooks/useSettings";

type Props = {
    settings: Settings;
    updateSettings: (newSettings: Partial<Settings>) => void;
    onClose: () => void;
};

type ToggleOption<T> = {
    label: string;
    value: T;
};

function ToggleGroup<T>({
    value,
    options,
    onChange,
}: {
    value: T;
    options: readonly ToggleOption<T>[];
    onChange: (v: T) => void;
}) {
    return (
        <div className="flex bg-slate-900 border border-slate-700 rounded p-0.5">
            {options.map(opt => {
                const isActive = value === opt.value;
                return (
                    <button
                        key={String(opt.value)}
                        className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${isActive
                                ? "bg-green-700 text-white"
                                : "text-slate-400 hover:text-slate-200"
                            }`}
                        onClick={() => onChange(opt.value)}
                        aria-pressed={isActive}
                    >
                        {opt.label}
                    </button>
                );
            })}
        </div>
    );
}

export default function SettingsPopover({ settings, updateSettings, onClose }: Props) {
    const popoverRef = useRef<HTMLDivElement>(null);

    // Escape and click outside to close popover
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        const handleClickOutside = (e: MouseEvent) => {
            if (
                popoverRef.current &&
                !popoverRef.current.contains(e.target as Node) &&
                !(e.target as Element).closest('#settings-button')
            ) {
                onClose();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [onClose]);

    return (
        <div
            ref={popoverRef}
            className="absolute top-full right-0 mt-3 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl p-4 w-[420px] z-[100] animate-in fade-in slide-in-from-top-2 duration-200"
            role="dialog"
            aria-label="Editor Settings"
        >
            {/* Mũi tên trỏ lên (Caret) */}
            <div className="absolute -top-2 right-1.5 w-4 h-4 bg-slate-800 border-l border-t border-slate-600 rotate-45"></div>

            <div className="relative z-10 space-y-4">
                {/* Theme */}
                <div className="flex items-center justify-between">
                    <span className="text-slate-200 text-sm font-medium">Theme</span>
                    <ToggleGroup
                        value={settings.theme}
                        options={[
                            { label: "Dark", value: "vs-dark" as Theme },
                            { label: "Light", value: "vs-light" as Theme },
                            { label: "High Contrast", value: "hc-black" as Theme },
                        ] as const}
                        onChange={(theme) => updateSettings({ theme })}
                    />
                </div>

                {/* Editor Mode */}
                <div className="flex items-center justify-between">
                    <span className="text-slate-200 text-sm font-medium">Editor Mode</span>
                    <ToggleGroup
                        value={settings.editorMode}
                        options={[
                            { label: "Emacs", value: "emacs" as EditorMode },
                            { label: "Normal", value: "normal" as EditorMode },
                            { label: "Vim", value: "vim" as EditorMode },
                        ] as const}
                        onChange={(editorMode) => updateSettings({ editorMode })}
                    />
                </div>

                {/* Tab Spaces */}
                <div className="flex items-center justify-between">
                    <span className="text-slate-200 text-sm font-medium">Tab Spaces</span>
                    <ToggleGroup
                        value={settings.tabSpaces}
                        options={[
                            { label: "2 spaces", value: 2 as const },
                            { label: "4 spaces", value: 4 as const },
                            { label: "8 spaces", value: 8 as const },
                        ] as const}
                        onChange={(tabSpaces) => updateSettings({ tabSpaces })}
                    />
                </div>

                {/* Autocomplete */}
                <div className="flex items-center justify-between">
                    <span className="text-slate-200 text-sm font-medium">Autocomplete <span className="text-slate-500 cursor-help" title="Infor">ⓘ</span></span>
                    <ToggleGroup
                        value={settings.autoComplete}
                        options={[
                            { label: "Enable", value: true },
                            { label: "Disable", value: false },
                        ] as const}
                        onChange={(autoComplete) => updateSettings({ autoComplete })}
                    />
                </div>
            </div>
        </div>
    );
}
