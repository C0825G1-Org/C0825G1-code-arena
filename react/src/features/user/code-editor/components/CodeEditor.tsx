import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { editor as MonacoEditor } from "monaco-editor";
import { initVimMode } from 'monaco-vim';
import { debounce } from 'lodash';

import { Settings } from "../hooks/useSettings";

type Props = {
    language: string;
    value: string;
    onChange: (value: string) => void;
    settings: Settings;
};

function CodeEditor({ language, value, onChange, settings }: Props) {
    const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
    const vimModeRef = useRef<{ dispose: () => void } | null>(null);
    const vimStatusNodeRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ lineNumber: 1, column: 1 });

    const handleEditorDidMount: OnMount = (editor, monacoInstance) => {
        editorRef.current = editor;

        editor.onDidChangeCursorPosition((e) => {
            setPosition({ lineNumber: e.position.lineNumber, column: e.position.column });
        });

        applyEditorMode(editor);
    };

    const applyEditorMode = useCallback((editor: MonacoEditor.IStandaloneCodeEditor) => {
        if (vimModeRef.current) {
            vimModeRef.current.dispose();
            vimModeRef.current = null;
        }

        if (vimStatusNodeRef.current) {
            vimStatusNodeRef.current.innerHTML = "";
        }

        if (settings.editorMode === "vim" && vimStatusNodeRef.current) {
            // initVimMode uses global window.monaco inside, so we must inject it here cleanly
            if (!(window as any).monaco) {
                (window as any).monaco = monaco;
            }
            vimModeRef.current = initVimMode(editor, vimStatusNodeRef.current);
        } else if (settings.editorMode === "emacs") {
            console.warn("Emacs mode is not fully supported yet in this IDE version.");
        }
    }, [settings.editorMode]);

    useEffect(() => {
        if (editorRef.current) {
            applyEditorMode(editorRef.current);
        }

        return () => {
            if (vimModeRef.current) {
                try {
                    vimModeRef.current.dispose();
                } catch (e) {
                    console.warn("Failed to dispose vim/emacs mode safely", e);
                }
                vimModeRef.current = null;
            }
            // Không được dispose editorRef của Monaco ở Component unmount, thư viện @monaco-editor/react sẽ tự hook và làm điều này.
            // Nếu gọi thủ công sẽ bắn lỗi "Cannot read properties of null (reading 'getFullModelRange')".
        }
    }, [settings.editorMode, applyEditorMode]);

    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.updateOptions({
                tabSize: settings.tabSpaces,
                insertSpaces: true
            });
        }
    }, [settings.tabSpaces]);

    const debouncedOnChange = useMemo(
        () => debounce((val: string) => onChange(val), 300),
        [onChange]
    );

    return (
        <div className="flex flex-col h-full w-full">
            <div className="flex-1 overflow-hidden relative">
                <Editor
                    height="100%"
                    language={language}
                    theme={settings.theme}
                    value={value}
                    onChange={(v) => debouncedOnChange(v || "")}
                    onMount={handleEditorDidMount}
                    options={{
                        fontFamily: "Fira Code",
                        fontLigatures: true,
                        minimap: { enabled: false }, // Đã bỏ theo yêu cầu
                        automaticLayout: true,
                        fontSize: 14,
                        tabSize: settings.tabSpaces,
                        insertSpaces: true, // Ép tab luôn dùng spaces
                        detectIndentation: false, // Tắt tự động nhận diện tab cũ
                        autoClosingBrackets: settings.autoComplete ? "always" : "never",
                        suggestOnTriggerCharacters: settings.autoComplete,
                    }}
                />
            </div>

            {/* Status bar */}
            <div className="shrink-0 h-6 bg-[#f8f9fa] dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 text-xs font-mono text-slate-500 dark:text-slate-400 select-none">
                <div className="flex items-center">
                    {settings.editorMode === 'emacs' && <span className="text-blue-500 dark:text-blue-400">EMACS</span>}
                    <div
                        ref={vimStatusNodeRef}
                        className={`text-green-600 dark:text-green-500 ${settings.editorMode === 'vim' ? 'block' : 'hidden'}`}
                    ></div>
                </div>
                <div className="text-blue-500 dark:text-blue-400">
                    Line: {position.lineNumber} Col: {position.column}
                </div>
            </div>
        </div>
    );
}

export default CodeEditor;