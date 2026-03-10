type Language = "javascript" | "java" | "python" | "cpp";

type Props = {
    language: Language;
    onChange: (lang: Language) => void;
};

const LANGUAGES = [
    { value: "javascript", label: "JavaScript" },
    { value: "java", label: "Java" },
    { value: "python", label: "Python" },
    { value: "cpp", label: "C++" },
] as const;

export default function LanguageSelector({ language, onChange }: Props) {
    return (
        <select
            value={language}
            onChange={(e) => onChange(e.target.value as Language)}
            aria-label="Chọn ngôn ngữ lập trình"
            className="bg-slate-800 text-slate-200 border border-slate-600 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block px-3 py-1.5 shadow-sm min-w-[140px] cursor-pointer"
        >
            {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                    {lang.label}
                </option>
            ))}
        </select>
    );
}