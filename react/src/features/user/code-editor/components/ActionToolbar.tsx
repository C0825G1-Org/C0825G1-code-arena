import React from 'react';
import { Play, PaperPlaneRight, CheckCircle, Clock, DotsThreeVertical, Warning } from '@phosphor-icons/react';
import LanguageSelector from './LanguageSelector';
import SettingsPopover from './SettingsPopover';
import { Language } from '../hooks/useArena';

interface ActionToolbarProps {
    language: Language;
    onChangeLanguage: (lang: Language) => void;
    isSubmitting: boolean;
    isTimeUp: boolean;
    isExamMode: boolean;
    participantStatus?: string;
    submitCount: number;
    isAC: boolean;
    onRunCode: () => void;
    onSubmit: () => void;
    onResetCode: () => void;
    isSettingsOpen: boolean;
    onToggleSettings: (isOpen: boolean) => void;
    settings: any;
    onUpdateSettings: (s: any) => void;
}

export const ActionToolbar: React.FC<ActionToolbarProps> = ({
    language,
    onChangeLanguage,
    isSubmitting,
    isTimeUp,
    isExamMode,
    participantStatus,
    submitCount,
    isAC,
    onRunCode,
    onSubmit,
    onResetCode,
    isSettingsOpen,
    onToggleSettings,
    settings,
    onUpdateSettings
}) => {
    const disabled = isSubmitting || isTimeUp || (isExamMode && participantStatus !== 'JOINED');
    const limitReached = submitCount >= 50;
    const submitDisabled = disabled || limitReached;

    return (
        <div className="tour-action-toolbar flex justify-between items-center px-4 py-2 bg-[#0f172a]/80 backdrop-blur border-b border-white/5 z-20">
            {/* Cụm chức năng trái */}
            <div className="flex items-center gap-4">
                <div className="tour-language-selector flex items-center gap-2">
                    <span className="text-slate-500 dark:text-slate-400 text-sm">Language</span>
                    <LanguageSelector
                        language={language}
                        onChange={onChangeLanguage}
                    />
                </div>
            </div>

            {/* Cụm chức năng phải */}
            <div className="flex items-center gap-3 relative">
                {/* Nút Chạy thử */}
                <button
                    onClick={onRunCode}
                    disabled={disabled}
                    className={`tour-run-btn px-4 xl:px-6 py-2 xl:py-2.5 rounded-lg flex items-center gap-2 font-bold transition-all w-full sm:w-auto justify-center ${disabled ? 'bg-slate-500 text-slate-300 cursor-not-allowed' :
                        'bg-slate-700/50 hover:bg-slate-700 text-white border border-white/10 hover:border-white/20'
                        }`}
                >
                    <Play size={18} weight="fill" className={isSubmitting ? "opacity-50" : "text-blue-400"} />
                    Chạy mẫu
                </button>

                {/* Nút Nộp bài */}
                <button
                    onClick={onSubmit}
                    disabled={submitDisabled}
                    className={`tour-submit-btn px-6 py-2 xl:py-2.5 rounded-lg flex items-center gap-2 font-bold transition-all w-full sm:w-auto justify-center ${limitReached ? 'bg-slate-500 text-slate-300 cursor-not-allowed' :
                        isAC ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20' :
                            'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/20'
                        }`}
                >
                    {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : isAC ? (
                        <CheckCircle size={16} weight="fill" />
                    ) : (
                        <PaperPlaneRight size={18} weight="fill" />
                    )}
                    {isSubmitting ? 'Đang gửi...' :
                        isAC ? `Đã AC (${submitCount}/50)` :
                            limitReached ? 'Hết lượt (50/50)' :
                                `Nộp bài (${submitCount}/50)`}
                </button>

                <button
                    onClick={onResetCode}
                    className="tour-reset-btn text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors tooltip flex items-center justify-center w-8 h-8 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                    title="Làm mới code"
                >
                    <Clock size={20} weight="bold" />
                </button>

                <button
                    id="settings-button"
                    onClick={() => onToggleSettings(!isSettingsOpen)}
                    className={`tour-settings-btn transition-colors tooltip flex items-center justify-center w-8 h-8 rounded ${isSettingsOpen ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                    title="Tùy chọn khác"
                >
                    <DotsThreeVertical size={24} weight="bold" />
                </button>

                {/* Settings Popover */}
                {isSettingsOpen && (
                    <div className="absolute top-full right-0 z-50 mt-1">
                        <SettingsPopover
                            settings={settings}
                            updateSettings={onUpdateSettings}
                            onClose={() => onToggleSettings(false)}
                        />
                    </div>
                )}
            </div>

            {isExamMode && participantStatus !== 'JOINED' && (
                <div className="absolute top-10 inset-x-0 z-[30] bg-orange-500/90 backdrop-blur-sm py-1.5 px-4 flex items-center justify-center gap-2 text-white font-bold text-xs shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="p-0.5 bg-white/20 rounded"><Warning size={14} weight="fill" /></div>
                    <span>BẠN ĐÃ KẾT THÚC LƯỢT THI - CHẾ ĐỘ CHỈ XEM</span>
                </div>
            )}
        </div>
    );
};
