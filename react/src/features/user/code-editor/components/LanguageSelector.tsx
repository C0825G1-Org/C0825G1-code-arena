type Props = {
    language: string;
    onChange: (lang: string) => void;
};

export default function LanguageSelector({ language, onChange }: Props) {
    return (
        <select
            value={language}
            onChange={(e) => onChange(e.target.value)}
            className="bg-slate-800 text-slate-200 border border-slate-600 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block px-3 py-1.5 shadow-sm min-w-[140px] cursor-pointer"
        >
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
        </select>
    );
}