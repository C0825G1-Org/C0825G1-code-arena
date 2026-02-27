import { useCallback, useEffect, useState } from "react";
import { boilerplateMap } from "../constants";

export type Language = "javascript" | "java" | "python" | "cpp";

type CodeByLanguage = {
    [key in Language]?: string;
};

export function useArena(problemId: number) {
    const [language, setLanguage] = useState<Language>("javascript");
    const [codeMap, setCodeMap] = useState<CodeByLanguage>({});
    const [isUnsaved, setIsUnsaved] = useState<boolean>(false);

    const currentCode = codeMap[language] ?? "";

    /**
     * Init and load code mapping from localStorage
     */
    useEffect(() => {
        const saved = localStorage.getItem(`arena:code:${problemId}:${language}`);
        setCodeMap((prev) => {
            if (prev[language] !== undefined) return prev; // Đã load trong mapping memory
            return {
                ...prev,
                [language]: saved !== null ? saved : boilerplateMap[language]
            };
        });
    }, [language, problemId]);

    /**
     * Auto save (debounce 2s)
     */
    useEffect(() => {
        if (!currentCode) return; // Wait cho tới khi load xong memory
        const timer = setTimeout(() => {
            localStorage.setItem(`arena:code:${problemId}:${language}`, currentCode);
        }, 2000);

        return () => clearTimeout(timer);
    }, [currentCode, language, problemId]);

    /**
     * Set unsaved flag when code changes
     */
    const handleCodeChange = useCallback((newCode: string) => {
        setCodeMap((prev) => ({
            ...prev,
            [language]: newCode
        }));
        setIsUnsaved(true);
    }, [language]);

    /**
     * Change language (Chỉ đổi active language, không đè code đệm)
     */
    const changeLanguage = useCallback((lang: Language) => {
        setLanguage(lang);
    }, []);

    /**
     * Submit handler (Chỉ payload code context được chọn)
     */
    const submit = useCallback(() => {
        const payload = {
            problemId,
            language,
            sourceCode: currentCode,
        };
        console.log("Payload ready:", payload);
        setIsUnsaved(false); // Reset unsaved flag on submit
    }, [problemId, language, currentCode]);

    /**
     * Reset code về boilerplate mặc định
     */
    const resetCode = useCallback(() => {
        setCodeMap((prev) => ({
            ...prev,
            [language]: boilerplateMap[language]
        }));
        setIsUnsaved(false);
    }, [language]);

    /**
     * Keyboard shortcut Ctrl / Cmd + Enter
     */
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                submit();
            }
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [submit]);

    /**
     * Prevent tab close/reload if unsaved
     */
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isUnsaved) {
                e.preventDefault();
                e.returnValue = "Bạn có chắc muốn rời đi? Code chưa submit sẽ bị mất"; // Legacy browser support
                return "Bạn có chắc muốn rời đi? Code chưa submit sẽ bị mất";
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isUnsaved]);

    return {
        language,
        code: currentCode,
        setCode: handleCodeChange,
        changeLanguage,
        submit,
        resetCode,
    };
}