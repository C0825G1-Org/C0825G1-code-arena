import { useCallback, useEffect, useState, useRef } from "react";
import { boilerplateMap, normalizeEditorLanguage } from "../constants";
import { getProblem, Problem } from "../services/problemService";
import { useSelector } from "react-redux";
import { RootState } from "../../../../app/store";

export type Language = "javascript" | "java" | "python" | "cpp";

type CodeByLanguage = {
    [key in Language]?: string;
};

export function useArena(problemId: number, contestId?: string | null, isReadOnly = false) {
    const { user } = useSelector((state: RootState) => state.auth);
    const userId = user?.id || "guest";
    const contextMode = contestId ? `contest:${contestId}` : "practice";

    const [language, setLanguage] = useState<Language>("javascript");
    const [codeMap, setCodeMap] = useState<CodeByLanguage>({});
    const [isUnsaved, setIsUnsaved] = useState<boolean>(false);
    const [problemTemplates, setProblemTemplates] = useState<Record<string, string>>({});
    const [isTemplatesLoading, setIsTemplatesLoading] = useState<boolean>(true);

    // Reset synchronous state when problemId changes to prevent code overlapping
    const lastProblemIdRef = useRef(problemId);
    if (lastProblemIdRef.current !== problemId) {
        lastProblemIdRef.current = problemId;
        setCodeMap({});
        setIsUnsaved(false);
        setIsTemplatesLoading(true);
    }

    const currentCode = codeMap[language] ?? "";

    /**
     * Reset codeMap when user, problem or contest changes
     */
    useEffect(() => {
        setCodeMap({});
        setIsUnsaved(false);
        setIsTemplatesLoading(true);

        if (problemId <= 0) {
            setIsTemplatesLoading(false);
            return;
        }

        // Fetch problem templates
        getProblem(problemId).then(data => {
            if (data.ioTemplates) {
                const templates: Record<string, string> = {};
                data.ioTemplates.forEach(t => {
                    const editorLang = normalizeEditorLanguage(t.languageName);
                    templates[editorLang] = t.templateCode;
                });
                setProblemTemplates(templates);
            }
        })
            .catch(err => console.error("Failed to fetch problem templates", err))
            .finally(() => setIsTemplatesLoading(false));
    }, [userId, problemId, contextMode]);

    /**
     * Init and load code mapping from localStorage
     * Trong chế độ thi (có contestId), KHÔNG load từ localStorage → luôn bắt đầu với boilerplate trắng
     */
    useEffect(() => {
        if (isTemplatesLoading) return; // Prevent initializing with wrong fallback before templates load

        const storageKey = `arena:code:${userId}:${contextMode}:${problemId}:${language}`;
        const saved = isReadOnly ? null : localStorage.getItem(storageKey);

        setCodeMap((prev) => {
            // Thứ tự ưu tiên: 
            // 1. Code từ localStorage (nếu không read-only) 
            // 2. Template từ Problem (Moderator thiết lập)
            // 3. Boilerplate mặc định của hệ thống
            const templateCode = problemTemplates[language];
            const fallbackCode = templateCode || (boilerplateMap[language] ?? "");

            // Nếu người dùng đã gõ code (prev[language] tồn tại) thì không ghi đè trừ khi template vừa load xong (isTemplatesLoading thay đổi)
            const currentInMemory = prev[language];
            const hasUserTyped = currentInMemory !== undefined && currentInMemory !== null && currentInMemory.trim() !== "";

            return {
                ...prev,
                [language]: (saved && saved.trim() !== "") ? saved : (hasUserTyped ? currentInMemory : fallbackCode)
            };
        });
    }, [language, problemId, userId, contestId, contextMode, isReadOnly, problemTemplates, isTemplatesLoading]);


    /**
     * Auto save (debounce 2s)
     */
    useEffect(() => {
        if (!currentCode || isReadOnly) return; // Không lưu khi read-only để tránh ghi đè code rỗng
        const storageKey = `arena:code:${userId}:${contextMode}:${problemId}:${language}`;

        const timer = setTimeout(() => {
            localStorage.setItem(storageKey, currentCode);
        }, 1500);

        return () => {
            clearTimeout(timer);
            if (!isReadOnly) {
                // Lưu ngay khi unmount (không lưu khi read-only)
                localStorage.setItem(storageKey, currentCode);
            }
        };
    }, [currentCode, language, problemId, userId, contextMode, isReadOnly]);

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
        const templateCode = problemTemplates[language];
        const fallbackCode = templateCode || (boilerplateMap[language] ?? "");

        setCodeMap((prev) => ({
            ...prev,
            [language]: fallbackCode
        }));
        setIsUnsaved(false);
    }, [language, problemTemplates]);

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
        setRawCode: (newCode: string) => setCodeMap(prev => ({ ...prev, [language]: newCode })),
        changeLanguage,
        submit,
        resetCode,
    };
}