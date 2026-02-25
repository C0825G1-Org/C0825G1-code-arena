import { useState, useEffect } from "react";

export type Settings = {
    theme: "vs-dark" | "vs-light" | "hc-black";
    autoComplete: boolean;
    editorMode: "emacs" | "normal" | "vim";
    tabSpaces: 2 | 4 | 8;
};

const defaultSettings: Settings = {
    theme: "vs-dark",
    autoComplete: true,
    editorMode: "normal",
    tabSpaces: 4,
};

export function useSettings() {
    const [settings, setSettings] = useState<Settings>(defaultSettings);

    useEffect(() => {
        const saved = localStorage.getItem("arena_settings");
        if (saved) {
            try {
                setSettings(JSON.parse(saved));
            } catch (e) { }
        }
    }, []);

    const updateSettings = (newSettings: Partial<Settings>) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        localStorage.setItem("arena_settings", JSON.stringify(updated));
    };

    return { settings, updateSettings };
}
